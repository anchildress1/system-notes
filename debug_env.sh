#!/usr/bin/env bash
# debug_env.sh
set -x # print commands

echo "Checking env files..."
for env_file in ".env" ".env.local" "apps/web/.env.local"; do
  if [ -f "$env_file" ]; then
    echo "Sourcing $env_file..."
    set -a
    # We use a subshell or allow error to see if it fails
    if ! source "$env_file"; then
        echo "FAILED to source $env_file"
    else
        echo "Sourced $env_file successfully"
    fi
    set +a
  else
    echo "Skipping $env_file (not found)"
  fi
done

echo "APP_ID length: ${#NEXT_PUBLIC_ALGOLIA_APPLICATION_ID}"
echo "API_KEY length: ${#ALGOLIA_ADMIN_API_KEY}"
echo "APP_ID value: '$NEXT_PUBLIC_ALGOLIA_APPLICATION_ID'"
