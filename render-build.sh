#!/usr/bin/env bash
# exit on error
set -o errexit

# Define local cache directory
export PUPPETEER_CACHE_DIR=$(pwd)/.cache/puppeteer

echo "--- INSTALLING DEPENDENCIES ---"
npm install

echo "--- INSTALLING CHROME ---"
# Explicitly install to our local folder
npx puppeteer browsers install chrome

echo "--- VERIFYING INSTALLATION ---"
if [ -d "$PUPPETEER_CACHE_DIR" ]; then
  echo "Cache directory exists at $PUPPETEER_CACHE_DIR"
  # List files to see if chrome is actually there
  find "$PUPPETEER_CACHE_DIR" -name "chrome" -type f
else
  echo "ERROR: Cache directory $PUPPETEER_CACHE_DIR was not created!"
fi

echo "--- BUILDING APP ---"
npm run build
