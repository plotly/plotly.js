#!/usr/bin/env bash

# Usage: $ ./circleci_image_artifact_download.sh JOB_NUMBER DEST_DIR

# The job number is shown on the job page in the navigation breadcrumbs under 'Job':
# ...   Job
# ... > test-baselines (123456)
# It's also shown in the URL: '.../jobs/123456/...'

set -euo pipefail

# Arguments
JOB_NUMBER="${1:-}"
DEST_DIR="${2:-.}"

# Check if job number is provided
if [[ -z "$JOB_NUMBER" ]]; then
  echo "CircleCI job number required. Usage: $0 <job-number> [destination-directory]"
  exit 1
fi

mkdir -p "$DEST_DIR"
cd "$DEST_DIR"

# Get list of artifact URLs (filtering for .png files not containing 'diff')
artifact_urls=$(curl https://circleci.com/api/v2/project/github/plotly/plotly.js/$JOB_NUMBER/artifacts \
  | grep -oE "https.*png" \
  | grep -v "diff")

# Download each artifact
echo "$artifact_urls" | while read -r url; do
  echo "Downloading $url..."
  curl -s -L -O "$url"
done

echo "✅ All PNG artifacts saved to: $DEST_DIR"
