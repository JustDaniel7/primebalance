#!/bin/bash

# Deploy script for PrimeBalance
# Node 24 LTS, Next.js 16, Prisma 7
# Usage: ./deploy.sh [eu|na] [--init-db] [--migrate]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✅ Loaded .env${NC}"
else
    echo -e "${RED}❌ .env not found${NC}"
    exit 1
fi

# Validate required variables
REQUIRED_VARS=("DB_INSTANCE" "DB_NAME" "DB_USER" "DB_PASSWORD" "NEXTAUTH_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Missing required variable: $var${NC}"
        exit 1
    fi
done

# Defaults
INIT_DB=false
RUN_MIGRATE=false
REGION_ARG=""

# Parse arguments
for arg in "$@"; do
    case $arg in
        --init-db)
            INIT_DB=true
            ;;
        --migrate)
            RUN_MIGRATE=true
            ;;
        eu|na)
            REGION_ARG=$arg
            ;;
    esac
done

if [ -z "$REGION_ARG" ]; then
    echo "Usage: ./deploy.sh [eu|na] [--init-db] [--migrate]"
    echo ""
    echo "  eu         - Deploy to europe-west6 (Zürich)"
    echo "  na         - Deploy to us-central1 (Iowa)"
    echo "  --init-db  - Initialize Cloud SQL database (first time only)"
    echo "  --migrate  - Run Prisma migrations before deploy"
    exit 1
fi

case "$REGION_ARG" in
    eu)
        REGION="europe-west6"
        ;;
    na)
        REGION="us-central1"
        ;;
esac

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No GCP project configured. Run: gcloud config set project YOUR_PROJECT${NC}"
    exit 1
fi

echo -e "${YELLOW}Project: $PROJECT_ID${NC}"
echo -e "${YELLOW}Region:  $REGION${NC}"
echo ""

# Cloud SQL connection string
SQL_CONNECTION="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"

# Database URL for Cloud Run (Unix socket connection)
# Prisma 7 uses this via the adapter
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${SQL_CONNECTION}"

# Service URL (will be determined after first deploy)
SERVICE_URL="https://primebalance-${PROJECT_ID}.${REGION}.run.app"

# Initialize database if requested
if [ "$INIT_DB" = true ]; then
    echo -e "${YELLOW}🗄️  Initializing Cloud SQL database in $REGION...${NC}"
    
    echo "Enabling APIs..."
    gcloud services enable sqladmin.googleapis.com
    gcloud services enable sql-component.googleapis.com
    gcloud services enable run.googleapis.com
    
    echo "Creating Cloud SQL instance (this takes ~5-10 minutes)..."
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-type=SSD \
        --storage-size=10GB \
        --availability-type=zonal \
        --database-flags=cloudsql.iam_authentication=on
    
    echo "Creating database..."
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE
    
    echo "Creating application user..."
    gcloud sql users create $DB_USER \
        --instance=$DB_INSTANCE \
        --password="${DB_PASSWORD}"
    
    echo "Configuring IAM for Cloud Run..."
    # Get the compute service account
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:${COMPUTE_SA}" \
        --role="roles/cloudsql.client" \
        --quiet
    
    echo ""
    echo -e "${GREEN}✅ Database initialized!${NC}"
    echo "   Instance:   $DB_INSTANCE"
    echo "   Database:   $DB_NAME"
    echo "   User:       $DB_USER"
    echo "   Connection: $SQL_CONNECTION"
    echo ""
    echo -e "${YELLOW}⚠️  Run migrations now: ./deploy.sh $REGION_ARG --migrate${NC}"
    exit 0
fi

# Run migrations if requested
if [ "$RUN_MIGRATE" = true ]; then
    echo -e "${YELLOW}🔄 Running Prisma migrations...${NC}"
    
    # Check if cloud-sql-proxy is running
    if ! nc -z 127.0.0.1 5433 2>/dev/null; then
        echo "Starting cloud-sql-proxy..."
        cloud-sql-proxy ${SQL_CONNECTION} --port 5433 &
        PROXY_PID=$!
        sleep 3
        trap "kill $PROXY_PID 2>/dev/null" EXIT
    fi
    
    # Set DATABASE_URL for local proxy
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5433/${DB_NAME}"
    
    echo "Running migrations..."
    npx prisma migrate deploy
    
    echo "Seeding database..."
    npm run db:seed
    
    echo -e "${GREEN}✅ Migrations complete!${NC}"
fi

# Build checks
echo -e "${YELLOW}🔍 Pre-deploy checks...${NC}"

# Check required files exist
REQUIRED_FILES=("Dockerfile" "prisma.config.ts" "prisma/schema.prisma" "src/lib/prisma.ts")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done
echo "   ✓ Required files present"

# Check Prisma client is generated
if [ ! -d "src/generated/prisma" ]; then
    echo "   Generating Prisma client..."
    npx prisma generate
fi
echo "   ✓ Prisma client generated"

# Deploy to Cloud Run
echo ""
echo -e "${YELLOW}🚀 Deploying to Cloud Run ($REGION)...${NC}"

gcloud run deploy primebalance \
    --source . \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --port 8080 \
    --add-cloudsql-instances="$SQL_CONNECTION" \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" \
    --set-env-vars="NEXTAUTH_URL=${SERVICE_URL}" \
    --set-env-vars="GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}" \
    --set-env-vars="GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}" \
    --set-env-vars="GITHUB_ID=${GITHUB_ID:-}" \
    --set-env-vars="GITHUB_SECRET=${GITHUB_SECRET:-}" \
    --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
    --set-env-vars="CLOUD_SQL_CONNECTION_NAME=${SQL_CONNECTION}" \
    --set-env-vars="DB_NAME=${DB_NAME}" \
    --set-env-vars="DB_USER=${DB_USER}"

# Get actual service URL
ACTUAL_URL=$(gcloud run services describe primebalance --region=$REGION --format="value(status.url)" 2>/dev/null)

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "   Service URL: ${ACTUAL_URL}"
echo "   Region:      ${REGION}"
echo "   Database:    ${SQL_CONNECTION}"
echo ""

# Update NEXTAUTH_URL if different
if [ "$ACTUAL_URL" != "$SERVICE_URL" ]; then
    echo -e "${YELLOW}⚠️  Updating NEXTAUTH_URL to match actual service URL...${NC}"
    gcloud run services update primebalance \
        --region="$REGION" \
        --set-env-vars="NEXTAUTH_URL=${ACTUAL_URL}" \
        --quiet
    echo -e "${GREEN}✅ NEXTAUTH_URL updated${NC}"
fi

echo ""
echo "Next steps:"
echo "  - Visit ${ACTUAL_URL}"
echo "  - Login with: demo@primebalance.app / any password"
echo ""