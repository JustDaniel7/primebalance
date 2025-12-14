#!/bin/bash
# dev-start.sh - PrimeBalance local development startup

# 1. Start cloud-sql-proxy (in background)
cloud-sql-proxy \
  primebalance:europe-west6:primebalance-db \
  --port 5433 \
  --auto-iam-authn &

# Wait for proxy to be ready
sleep 2

# 2. Set DATABASE_URL with fresh IAM token
export DATABASE_URL="postgresql://ddxd2302@gmail.com:$(gcloud auth print-access-token)@127.0.0.1:5433/primebalance"

# 3. Generate Prisma client (if needed)
npx prisma generate

# 4. Start dev server
npm run dev