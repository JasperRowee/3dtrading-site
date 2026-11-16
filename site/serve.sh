#!/bin/sh
# r49 website preview, standalone: serves only this folder. Usage: sh serve.sh [port]  (default 8991; LAN: BIND=0.0.0.0)
cd "$(dirname "$0")" && exec python3 -m http.server "${1:-8991}" --bind "${BIND:-0.0.0.0}"
