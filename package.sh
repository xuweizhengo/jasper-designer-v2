#!/bin/bash
# Thin wrapper to the main packaging entry.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$DIR/scripts/package.sh" "$@"

