#!/bin/sh
export NODE_OPTIONS='--max-old-space-size=4096' && \
echo "node version: $(node --version)" && \
echo "npm version: $(npm --version)" && \
npm ci && \
echo "temporarily not do `npm ls`"
npm ls --prod --all
