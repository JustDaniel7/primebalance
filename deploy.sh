#!/bin/bash

# Deploy script for PrimeBalance
# Usage: ./deploy.sh [eu|na] [--init-db]

# Load environment variables from .env.server
if [ -f .env.server ]; then
    export $(grep -v '^#' .env.server | xargs)
    echo "✅ Loaded .env.server"
else
    echo "❌ .env.server not found"
    exit 1
fi

INIT_DB=false
REGION_ARG=""

# Parse arguments
for arg in "$@"; do
    case $arg in
        --init-db)
            INIT_DB=true
            ;;
        eu|na)
            REGION_ARG=$arg
            ;;
    esac
done

if [ -z "$REGION_ARG" ]; then
    echo "Usage: ./deploy.sh [eu|na] [--init-db]"
    echo "  eu        - Deploy to europe-west6 (Zürich)"
    echo "  na        - Deploy to us-central1 (Iowa)"
    echo "  --init-db - Initialize Cloud SQL database (first time only)"
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

PROJECT_ID=$(gcloud config get-value project)
SQL_CONNECTION="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${SQL_CONNECTION}"

# Initialize database if requested
if [ "$INIT_DB" = true ]; then
    echo "🗄️  Initializing Cloud SQL database in $REGION..."
    
    echo "Enabling APIs..."
    gcloud services enable sqladmin.googleapis.com
    gcloud services enable sql-component.googleapis.com
    
    echo "Creating Cloud SQL instance (this takes ~5 minutes)..."
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password="${DB_ROOT_PASSWORD}" \
        --storage-type=SSD \
        --storage-size=10GB \
        --availability-type=zonal
    
    echo "Creating database..."
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE
    
    echo "Creating application user..."
    gcloud sql users create $DB_USER \
        --instance=$DB_INSTANCE \
        --password="${DB_USER_PASSWORD}"
    
    echo "Configuring IAM..."
    SERVICE_ACCOUNT="${PROJECT_ID}-compute@developer.gserviceaccount.com"
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/cloudsql.client"
    
    echo "✅ Database initialized!"
    echo "Connection: $SQL_CONNECTION"
fi

echo "🚀 Deploying to $REGION..."

gcloud run deploy primebalance \
    --source . \
    --region "$REGION" \
    --allow-unauthenticated \
    --add-cloudsql-instances="$SQL_CONNECTION" \
    --set-env-vars="NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" \
    --set-env-vars="NEXTAUTH_URL=https://primebalance-575940724914.europe-west6.run.app" \
    --set-env-vars="GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" \
    --set-env-vars="GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}" \
    --set-env-vars="GITHUB_ID=${GITHUB_ID}" \
    --set-env-vars="GITHUB_SECRET=${GITHUB_SECRET}" \
    --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
    --set-env-vars="CLOUDSQL_IAM_AUTHENTICATION=true"

echo "✅ Deployment complete!"