#!/bin/bash
# db-proxy-server.sh
# One-time setup: Configure Cloud Run service account for IAM database auth
# Usage: ./db-proxy-server.sh

set -euo pipefail

echo "🔐 PrimeBalance Cloud Run IAM Database Setup"
echo "============================================="
echo ""

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✅ Loaded .env"
else
  echo "❌ .env not found"
  exit 1
fi

# Get project info
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT"
  exit 1
fi

# Get project number for service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

DB_INSTANCE="${DB_INSTANCE:-primebalance-db}"
DB_NAME="${DB_NAME:-primebalance}"

echo ""
echo "Project:         $PROJECT_ID"
echo "Project Number:  $PROJECT_NUMBER"
echo "Service Account: $SERVICE_ACCOUNT"
echo "DB Instance:     $DB_INSTANCE"
echo "DB Name:         $DB_NAME"
echo ""

# Step 1: Grant IAM roles
echo "📋 Step 1: Granting IAM roles to service account..."

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudsql.instanceUser" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudsql.client" \
  --quiet

echo "✅ IAM roles granted"
echo ""

# Step 2: Add service account as Cloud SQL IAM user
echo "📋 Step 2: Adding service account as Cloud SQL IAM user..."

# Check if user already exists
EXISTING_USER=$(gcloud sql users list --instance=$DB_INSTANCE --format="value(name)" | grep -F "${PROJECT_NUMBER}-compute" || true)

if [ -n "$EXISTING_USER" ]; then
  echo "✅ Service account already exists as Cloud SQL user"
else
  gcloud sql users create "${PROJECT_NUMBER}-compute@developer" \
    --instance=$DB_INSTANCE \
    --type=CLOUD_IAM_SERVICE_ACCOUNT
  echo "✅ Service account added as Cloud SQL IAM user"
fi
echo ""

# Step 3: Grant database permissions
echo "📋 Step 3: Granting database permissions..."
echo ""
echo "⚠️  You need to run these SQL commands manually."
echo "   Connect to the database:"
echo ""
echo "   gcloud sql connect $DB_INSTANCE --user=postgres --database=$DB_NAME"
echo ""
echo "   Then run:"
echo "   ----------------------------------------"

cat << EOF
GRANT ALL ON SCHEMA public TO "${PROJECT_NUMBER}-compute@${PROJECT_ID}.iam";
GRANT ALL ON DATABASE ${DB_NAME} TO "${PROJECT_NUMBER}-compute@${PROJECT_ID}.iam";
GRANT ALL ON ALL TABLES IN SCHEMA public TO "${PROJECT_NUMBER}-compute@${PROJECT_ID}.iam";
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${PROJECT_NUMBER}-compute@${PROJECT_ID}.iam";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${PROJECT_NUMBER}-compute@${PROJECT_ID}.iam";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${PROJECT_NUMBER}-compute@${PROJECT_ID}.iam";
EOF

echo "   ----------------------------------------"
echo ""

echo "============================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run the SQL commands above (step 3)"
echo "  2. Deploy with: ./deploy.sh eu"
echo ""