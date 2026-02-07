#!/bin/sh
set -eu

MAX_BACKOFF=60
BACKOFF=1

while true; do
  echo "[entrypoint] Starting Carp King backend..."
  node dist/index.js
  EXIT_CODE=$?
  echo "[entrypoint] Backend exited with code $EXIT_CODE"
  if [ "$EXIT_CODE" -eq 0 ]; then
    echo "[entrypoint] Exited cleanly; not restarting."
    exit 0
  fi
  echo "[entrypoint] Restarting in ${BACKOFF}s..."
  sleep "$BACKOFF"
  BACKOFF=$((BACKOFF * 2))
  if [ "$BACKOFF" -gt "$MAX_BACKOFF" ]; then
    BACKOFF=$MAX_BACKOFF
  fi
done
