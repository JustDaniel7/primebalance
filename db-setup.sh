#!/bin/bash

# db-setup.sh
# Database setup script for PrimeBalance
# Usage: ./db-setup.sh [local|cloud]
#
# Supports:
#   - Password auth (classic DB user/password)
#   - IAM Database Authentication (Cloud SQL Postgres) via short-lived access token
#
# Required env (depending on mode):
#   Common:
#     DB_NAME
#     DB_INSTANCE
#     DB_AUTH_MODE=iam|password        (optional; default: password)
#
#   IAM mode:
#     DB_IAM_USER=you@company.com      (must be added as IAM DB user in Cloud SQL)
#     gcloud authenticated (or ADC in CI)
#     cloud-sql-proxy running with --enable_iam_login (for local; for cloud if you proxy)
#
#   Password mode:
#     DB_USER
#     DB_USER_PASSWORD

set -euo pipefail

MODE=${1:-local}

# Load environment variables
if [ -f .env.server ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env.server | xargs)
  echo "✅ Loaded .env.server"
fi

# Defaults
DB_AUTH_MODE="${DB_AUTH_MODE:-password}"

get_iam_token() {
  gcloud auth print-access-token
}

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "❌ Missing required env var: $name"
    exit 1
  fi
}

set_database_url_local() {
  require_env "DB_NAME"

  if [ "$DB_AUTH_MODE" == "iam" ]; then
    require_env "DB_IAM_USER"
    export DATABASE_URL="postgresql://${DB_IAM_USER}:$(get_iam_token)@127.0.0.1:5433/${DB_NAME}"
    echo "🔐 DB auth: IAM (local) — using access token as password"
    echo "   Note: cloud-sql-proxy must be running on :5433 with --enable_iam_login"

  elif [ "$DB_AUTH_MODE" == "password" ]; then
    require_env "DB_USER"
    require_env "DB_USER_PASSWORD"
    export DATABASE_URL="postgresql://${DB_USER}:${DB_USER_PASSWORD}@127.0.0.1:5433/${DB_NAME}"
    echo "🔐 DB auth: password (local)"

  else
    echo "❌ Invalid DB_AUTH_MODE: $DB_AUTH_MODE (must be 'iam' or 'password')"
    exit 1
  fi
}

set_database_url_cloud() {
  require_env "DB_NAME"
  require_env "DB_INSTANCE"

  if [ "$DB_AUTH_MODE" == "iam" ]; then
    require_env "DB_IAM_USER"

    # Recommended: use Cloud SQL Auth Proxy / connector in cloud environments as well.
    # This assumes a proxy is available on 127.0.0.1:5433 (e.g., Cloud Run sidecar or local proxy).
    export DATABASE_URL="postgresql://${DB_IAM_USER}:$(get_iam_token)@127.0.0.1:5433/${DB_NAME}"
    echo "🔐 DB auth: IAM (cloud) — using access token as password"
    echo "   Note: This assumes connectivity via proxy/connector on 127.0.0.1:5433."
    echo "   (No authorized-networks / public IP needed.)"

  elif [ "$DB_AUTH_MODE" == "password" ]; then
    # Legacy direct-to-public-IP approach (kept for test setups)
    echo "📍 Authorizing current IP for Cloud SQL access (password mode)..."
    MY_IP=$(curl -s ifconfig.me)
    gcloud sql instances patch "$DB_INSTANCE" --authorized-networks="$MY_IP" --quiet

    INSTANCE_IP=$(gcloud sql instances describe "$DB_INSTANCE" --format="value(ipAddresses[0].ipAddress)")
    require_env "DB_USER"
    require_env "DB_USER_PASSWORD"
    export DATABASE_URL="postgresql://${DB_USER}:${DB_USER_PASSWORD}@${INSTANCE_IP}:5433/${DB_NAME}"

    echo "✅ Cloud SQL IP: $INSTANCE_IP"
    echo ""

  else
    echo "❌ Invalid DB_AUTH_MODE: $DB_AUTH_MODE (must be 'iam' or 'password')"
    exit 1
  fi
}

echo "🗄️  PrimeBalance Database Setup"
echo "================================"
echo ""

if [ "$MODE" == "local" ]; then
  echo "Mode: Local Development (using cloud-sql-proxy)"
  echo ""
  echo "Prerequisites:"
  echo "  1. cloud-sql-proxy running on port 5433"
  if [ "$DB_AUTH_MODE" == "iam" ]; then
    echo "     - and started with --enable_iam_login"
  fi
  echo "  2. .env.server contains DB_NAME, DB_INSTANCE (+ auth-specific vars)"
  echo ""

  # Always compute DATABASE_URL here (instead of requiring it pre-set)
  set_database_url_local

elif [ "$MODE" == "cloud" ]; then
  echo "Mode: Cloud Deployment"
  echo ""

  # Get Cloud SQL connection info (kept, in case you print/use it elsewhere)
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
  if [ -n "${PROJECT_ID:-}" ]; then
    SQL_CONNECTION="${PROJECT_ID}:europe-west6:${DB_INSTANCE}"
    export SQL_CONNECTION
  fi

  set_database_url_cloud

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

# Only remove IP authorization if we added it (password + cloud)
if [ "$MODE" == "cloud" ] && [ "$DB_AUTH_MODE" == "password" ]; then
  echo ""
  echo "🔒 Removing IP authorization..."
  gcloud sql instances patch "$DB_INSTANCE" --clear-authorized-networks --quiet
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