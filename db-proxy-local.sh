#!/bin/bash
# db-proxy-local.sh
# Start cloud-sql-proxy for local development
# Usage: ./db-proxy-local.sh

set -euo pipefail

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

DB_INSTANCE="${DB_INSTANCE:-primebalance-db}"
REGION="${REGION:-europe-west6}"
PORT="${DB_PORT:-5433}"

CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"

echo ""
echo "🔌 Starting Cloud SQL Proxy"
echo "   Connection: $CONNECTION_NAME"
echo "   Port:       $PORT"
echo ""

# Check if port is already in use
if lsof -i :$PORT > /dev/null 2>&1; then
  echo "⚠️  Port $PORT already in use. Proxy may already be running."
  echo "   To kill existing: kill \$(lsof -t -i :$PORT)"
  exit 1
fi

# Start proxy
cloud-sql-proxy "${CONNECTION_NAME}" --port $PORT