#!/bin/bash
# Send Allure results to Allure Docker server
# Usage: ./scripts/send-allure-results.sh [project_id]

PROJECT_ID="${1:-lms-e2e}"
RESULTS_DIR="allure-results"

if [ ! -d "$RESULTS_DIR" ]; then
  echo "Error: $RESULTS_DIR directory not found"
  exit 1
fi

cd "$RESULTS_DIR"

# Build curl args for all files (excluding subdirectories)
CURL_ARGS=""
for f in $(ls -p | grep -v /); do
  if [[ "$f" == *.json ]]; then
    CURL_ARGS="$CURL_ARGS -F files[]=@$f;type=application/json"
  else
    CURL_ARGS="$CURL_ARGS -F files[]=@$f"
  fi
done

if [ -z "$CURL_ARGS" ]; then
  echo "Error: No result files found in $RESULTS_DIR"
  exit 1
fi

echo "Sending Allure results to project '$PROJECT_ID'..."
curl -s -X POST \
  "http://localhost:5050/allure-docker-service/send-results?project_id=${PROJECT_ID}&force_project_creation=true" \
  -H 'Content-Type: multipart/form-data' \
  $CURL_ARGS

echo ""
echo "Done. Open: http://localhost:5050/allure-docker-service/projects/${PROJECT_ID}/reports/latest/index.html"
