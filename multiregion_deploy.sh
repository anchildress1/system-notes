#!/bin/bash
set -e

# ==================================================================================
# Configuration
# ==================================================================================
API_SERVICE_BASE="system-notes-api"
UI_SERVICE_BASE="system-notes-ui"
# Use a custom domain; for now we use a placeholder that the user must update or pass as an argument
DOMAIN="${1:-anchildress1.dev}" 

REGIONS=("us-east1" "europe-north1")

LB_NAME="system-notes-global-lb"
BACKEND_SERVICE_NAME="${LB_NAME}-backend"
URL_MAP_NAME="${LB_NAME}-url-map"
SSL_CERT_NAME="${LB_NAME}-cert"
TARGET_PROXY_NAME="${LB_NAME}-proxy"
FORWARDING_RULE_NAME="${LB_NAME}-forwarding-rule"
IP_NAME="${LB_NAME}-ip"

# Check dependencies
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed."
    exit 1
fi

# Load environment variables (OPENAI_API_KEY)
if [ -f "apps/api/.env" ]; then
    echo "Loading environment variables from apps/api/.env..."
    export $(grep -v '^#' apps/api/.env | xargs)
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY environment variable is not set."
    echo "Please export it or create apps/api/.env"
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "Error: No active gcloud project found."
    exit 1
fi

echo "=================================================="
echo "MULTI-REGION DEPLOYMENT STARTING"
echo "Project: $PROJECT_ID"
echo "Domain: $DOMAIN"
echo "Regions: ${REGIONS[*]}"
echo "=================================================="

# ==================================================================================
# Helper Functions
# ==================================================================================

# Simply create repo if not exists
ensure_repo() {
    local SKU=$1
    local REGION=$2
    if ! gcloud artifacts repositories describe "$SKU" --location="$REGION" &>/dev/null; then
        gcloud artifacts repositories create "$SKU" \
            --repository-format=docker \
            --location="$REGION" \
            --description="Repo for $SKU" &>/dev/null
    fi
}

deploy_api() {
    local REGION=$1
    local SERVICE_NAME="${API_SERVICE_BASE}-${REGION}"
    
    echo "--- Deploying API to $REGION ($SERVICE_NAME) ---"
    
    ensure_repo "$API_SERVICE_BASE" "$REGION"
    
    # Build and Deploy
    # We use 'gcloud run deploy --source' for simplicity in this script, 
    # ensuring it builds in the cloud.
    
    gcloud run deploy "$SERVICE_NAME" \
        --source apps/api \
        --region "$REGION" \
        --allow-unauthenticated \
        --min-instances 1 \
        --port 8080 \
        --labels dev-tutorial=devnewyear2026 \
        --service-account "system-notes-api@anchildress1.iam.gserviceaccount.com" \
        --set-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY}" \
        --quiet
}

deploy_ui() {
    local REGION=$1
    local API_URL=$2
    local SERVICE_NAME="${UI_SERVICE_BASE}-${REGION}"

    echo "--- Deploying UI to $REGION ($SERVICE_NAME) ---"

    ensure_repo "$UI_SERVICE_BASE" "$REGION"

    # For Next.js, we need to pass the API URL as a build arg or env var depending on setup.
    # The existing deploy.sh uses build args. Cloud Run 'deploy --source' doesn't easily support 
    # build args without a cloudbuild.yaml or using 'gcloud builds submit'.
    # We will use 'gcloud builds submit' then 'gcloud run deploy --image'.

    IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$UI_SERVICE_BASE/$SERVICE_NAME:latest"
    
    echo "Building UI Image for $REGION..."
    gcloud builds submit "apps/web" \
        --tag "$IMAGE_URI" \
        --substitutions=_NEXT_PUBLIC_API_URL="$API_URL" \
        --quiet
    # Note: 'apps/web' Dockerfile likely needs to accept the build arg.
    # Checking existing deploy.sh: passed as --build-arg via simple docker build command constructed in script.
    # If we use gcloud builds submit, we can use '--build-arg' if using Docker build.
    # Actually, gcloud builds submit auto-detects Dockerfile. We need to pass build-args.
    # Correct way with gcloud builds submit for docker build args:
    # We will construct a minimal cloudbuild.yaml on the fly to support build-args properly.

cat > cloudbuild_ui_$REGION.yaml <<EOF
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '--build-arg', 'NEXT_PUBLIC_API_URL=$API_URL', '-t', '$IMAGE_URI', '.']
images:
- '$IMAGE_URI'
EOF

    gcloud builds submit "apps/web" --config cloudbuild_ui_$REGION.yaml --quiet
    rm cloudbuild_ui_$REGION.yaml

    echo "Deploying UI Service..."
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_URI" \
        --region "$REGION" \
        --allow-unauthenticated \
        --min-instances 1 \
        --port 3000 \
        --labels dev-tutorial=devnewyear2026 \
        --service-account "system-notes-ui@anchildress1.iam.gserviceaccount.com" \
        --set-env-vars "NEXT_PUBLIC_API_URL=$API_URL" \
        --quiet
}

# ==================================================================================
# 1. Deploy Services
# ==================================================================================

# We will collect the UI service names for the NEG step
UI_SERVICES=()

for REGION in "${REGIONS[@]}"; do
    echo ""
    echo ">> Processing Region: $REGION"
    
    # 1. API
    deploy_api "$REGION"
    
    # Get API URL
    API_URL=$(gcloud run services describe "${API_SERVICE_BASE}-${REGION}" --region "$REGION" --format 'value(status.url)')
    echo "   API URL: $API_URL"
    
    # 2. UI
    deploy_ui "$REGION" "$API_URL"
    UI_SERVICES+=("${UI_SERVICE_BASE}-${REGION}")
done

echo ""
echo "=================================================="
echo "SERVICES DEPLOYED. CONFIGURING LOAD BALANCER..."
echo "=================================================="

# ==================================================================================
# 2. Load Balancer Setup
# ==================================================================================

# 1. Reserve Global IP
echo "Checking/Creating Global IP: $IP_NAME..."
if ! gcloud compute addresses describe "$IP_NAME" --global &>/dev/null; then
    gcloud compute addresses create "$IP_NAME" --global
fi
IP_ADDRESS=$(gcloud compute addresses describe "$IP_NAME" --global --format="value(address)")
echo "Global IP: $IP_ADDRESS"

# 2. Create Serverless NEGs (one per region)
NEG_NAMES=()
for i in "${!REGIONS[@]}"; do
    REGION=${REGIONS[$i]}
    SERVICE=${UI_SERVICES[$i]}
    NEG_NAME="${LB_NAME}-neg-${REGION}"
    
    echo "Creating NEG: $NEG_NAME for service $SERVICE in $REGION..."
    if ! gcloud compute network-endpoint-groups describe "$NEG_NAME" --region="$REGION" &>/dev/null; then
        gcloud compute network-endpoint-groups create "$NEG_NAME" \
            --region="$REGION" \
            --network-endpoint-type=serverless \
            --cloud-run-service="$SERVICE"
    fi
    NEG_NAMES+=("$NEG_NAME")
done

# 3. Create Backend Service
echo "Creating Backend Service: $BACKEND_SERVICE_NAME..."
if ! gcloud compute backend-services describe "$BACKEND_SERVICE_NAME" --global &>/dev/null; then
    gcloud compute backend-services create "$BACKEND_SERVICE_NAME" \
        --global \
        --load-balancing-scheme=EXTERNAL_MANAGED \
        --protocol=HTTPS
fi

# 4. Add NEGs to Backend Service
for i in "${!REGIONS[@]}"; do
    REGION=${REGIONS[$i]}
    NEG_NAME="${NEG_NAMES[$i]}"
    
    echo "Adding NEG $NEG_NAME to Backend Service..."
    # Check if already added to avoid error
    # A simple way is to try adding and ignore specific error, or list backends.
    # We'll just try adding; it will fail safely if it exists usually, or we can check output.
    # Actually 'backend-services add-backend' fails if it exists.
    
    EXISTING=$(gcloud compute backend-services describe "$BACKEND_SERVICE_NAME" --global --format="json" | grep "$NEG_NAME" || true)
    if [ -z "$EXISTING" ]; then
        gcloud compute backend-services add-backend "$BACKEND_SERVICE_NAME" \
            --global \
            --network-endpoint-group="$NEG_NAME" \
            --network-endpoint-group-region="$REGION"
    else
        echo "Example: Backend for $NEG_NAME already exists."
    fi
done

# 5. URL Map
echo "Creating URL Map: $URL_MAP_NAME..."
if ! gcloud compute url-maps describe "$URL_MAP_NAME" &>/dev/null; then
    gcloud compute url-maps create "$URL_MAP_NAME" --default-service "$BACKEND_SERVICE_NAME"
fi

# 6. Managed Certificate
echo "Creating Managed Certificate: $SSL_CERT_NAME for $DOMAIN..."
if ! gcloud compute ssl-certificates describe "$SSL_CERT_NAME" &>/dev/null; then
    gcloud compute ssl-certificates create "$SSL_CERT_NAME" \
        --domains="$DOMAIN"
else
    echo "Certificate $SSL_CERT_NAME exists."
fi

# 7. Target HTTPS Proxy
echo "Creating Target HTTPS Proxy: $TARGET_PROXY_NAME..."
if ! gcloud compute target-https-proxies describe "$TARGET_PROXY_NAME" &>/dev/null; then
    gcloud compute target-https-proxies create "$TARGET_PROXY_NAME" \
        --url-map="$URL_MAP_NAME" \
        --ssl-certificates="$SSL_CERT_NAME"
fi

# 8. Global Forwarding Rule
echo "Creating Global Forwarding Rule: $FORWARDING_RULE_NAME..."
if ! gcloud compute forwarding-rules describe "$FORWARDING_RULE_NAME" --global &>/dev/null; then
    gcloud compute forwarding-rules create "$FORWARDING_RULE_NAME" \
        --load-balancing-scheme=EXTERNAL_MANAGED \
        --network-tier=PREMIUM \
        --address="$IP_ADDRESS" \
        --global \
        --target-https-proxy="$TARGET_PROXY_NAME" \
        --ports=443
fi

echo "=================================================="
echo "SETUP COMPLETE!"
echo "=================================================="
echo "1. Update your DNS:"
echo "   Create an A record for $DOMAIN pointing to $IP_ADDRESS"
echo ""
echo "2. Check Certificate Status:"
echo "   gcloud compute ssl-certificates describe $SSL_CERT_NAME --global --format='value(managed.status)'"
echo "   (It may take up to 60 minutes to become ACTIVE after DNS propagation)"
echo ""
echo "3. Verify Access:"
echo "   Once active, visit https://$DOMAIN"
echo "   You can also check /health or other endpoints to verify regional routing."
echo "=================================================="
