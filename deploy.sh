#!/bin/bash

# Deploy script for PrimeBalance
# Usage: ./deploy.sh [eu|na]

if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh [eu|na]"
    echo "  eu - Deploy to europe-west6 (Zürich)"
    echo "  na - Deploy to us-central1 (Iowa)"
    exit 1
fi

case "$1" in
    eu)
        REGION="europe-west6"
        ;;
    na)
        REGION="us-central1"
        ;;
    *)
        echo "Invalid region: $1"
        echo "Use 'eu' or 'na'"
        exit 1
        ;;
esac

echo "Deploying to $REGION..."

gcloud run deploy primebalance \
    --source . \
    --region "$REGION" \
    --allow-unauthenticated