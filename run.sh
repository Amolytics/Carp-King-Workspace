#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

cd backend
npm install

export PORT="${PORT:-4000}"
npm run dev
