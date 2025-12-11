#!/bin/bash

# db-setup.sh
# Database setup script for PrimeBalance
# Usage: ./db-setup.sh [local|cloud]

set -e

MODE=${1:-local}

# Load environment variables
if [ -f .env.server ]; then
    export $(grep -v '^#' .env.server | xargs)
    echo "✅ Loaded .env.server"
fi

echo "🗄️  PrimeBalance Database Setup"
echo "================================"
echo ""

if [ "$MODE" == "local" ]; then
    echo "Mode: Local Development (using cloud-sql-proxy)"
    echo ""
    echo "Prerequisites:"
    echo "  1. cloud-sql-proxy running on port 5432"
    echo "  2. DATABASE_URL set in .env.server"
    echo ""
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL not set in .env.server"
        echo ""
        echo "For local development with cloud-sql-proxy, add this to .env.server:"
        echo "DATABASE_URL=postgresql://${DB_USER}:${DB_USER_PASSWORD}@127.0.0.1:5432/${DB_NAME}"
        exit 1
    fi
    
elif [ "$MODE" == "cloud" ]; then
    echo "Mode: Cloud Deployment"
    echo ""
    
    # Get Cloud SQL connection info
    PROJECT_ID=$(gcloud config get-value project)
    SQL_CONNECTION="${PROJECT_ID}:europe-west6:${DB_INSTANCE}"
    
    # Authorize current IP temporarily
    echo "📍 Authorizing current IP for Cloud SQL access..."
    MY_IP=$(curl -s ifconfig.me)
    gcloud sql instances patch $DB_INSTANCE --authorized-networks=$MY_IP --quiet
    
    # Get instance IP
    INSTANCE_IP=$(gcloud sql instances describe $DB_INSTANCE --format="value(ipAddresses[0].ipAddress)")
    
    # Set DATABASE_URL for direct connection
    export DATABASE_URL="postgresql://${DB_USER}:${DB_USER_PASSWORD}@${INSTANCE_IP}:5432/${DB_NAME}"
    
    echo "✅ Cloud SQL IP: $INSTANCE_IP"
    echo ""
else
    echo "❌ Invalid mode: $MODE"
    echo "Usage: ./db-setup.sh [local|cloud]"
    exit 1
fi

echo "🔄 Generating Prisma client..."
npx prisma generate

echo ""
echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo ""
echo "🌱 Seeding database with demo data..."
npm run db:seed

if [ "$MODE" == "cloud" ]; then
    echo ""
    echo "🔒 Removing IP authorization..."
    gcloud sql instances patch $DB_INSTANCE --clear-authorized-networks --quiet
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "You can now:"
echo "  - Run 'npm run dev' for local development"
echo "  - Run './deploy.sh eu' to deploy to Cloud Run"
echo ""
echo "Demo login credentials:"
echo "  Email: demo@primebalance.app"
echo "  Password: demo123456"