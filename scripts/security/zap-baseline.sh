#!/usr/bin/env bash
#
# OWASP ZAP baseline scan against the locally running Military LMS API.
#
# Usage:
#   ./scripts/security/zap-baseline.sh [target-url]
#
# Defaults to the backend API (http://host.docker.internal:8001/api/v1).
# Requires: Docker, and the backend running locally (pnpm api / pnpm api:dev).
#
# Produces a self-contained HTML report at reports/zap/zap-report.html.
# Note: this is an *unauthenticated* baseline scan (passive rules + light
# active checks against the spidered surface). Most endpoints here require
# a Keycloak Bearer token, so ZAP will mostly report generic
# headers/cookies/TLS/config issues rather than deep authenticated business
# logic - that part is still up to manual/officer review.

set -euo pipefail

TARGET="${1:-http://host.docker.internal:8001/api/v1}"
REPORT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/reports/zap"
mkdir -p "$REPORT_DIR"

echo "Running OWASP ZAP baseline scan against: $TARGET"
echo "Report will be written to: $REPORT_DIR/zap-report.html"

docker run --rm \
  -v "$REPORT_DIR:/zap/wrk:rw" \
  --add-host=host.docker.internal:host-gateway \
  zaproxy/zap-stable zap-baseline.py \
  -t "$TARGET" \
  -r zap-report.html \
  -J zap-report.json \
  -I   # do not fail the command on WARN-level alerts; review the report manually

echo "Done. Open $REPORT_DIR/zap-report.html to review findings."
