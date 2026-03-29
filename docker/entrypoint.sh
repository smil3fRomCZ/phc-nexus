#!/bin/sh
set -e

# Sync built public assets into the shared named volume.
# Uses -rf to overwrite existing files without preserving ownership
# (volume may be owned by root, container runs as appuser).
rm -rf /var/www/html/public/*
cp -r /var/www/html/public-build/. /var/www/html/public/

# Drop privileges and run the main process as appuser
exec su-exec appuser "$@"
