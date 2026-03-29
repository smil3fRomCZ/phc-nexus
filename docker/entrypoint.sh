#!/bin/sh
set -e

# Sync built public assets to the shared volume.
# The app-public named volume is shared with Caddy so it can serve
# static files (CSS/JS/images) directly. We copy on every container
# start to ensure the volume always reflects the current image build.
cp -a /var/www/html/public-build/. /var/www/html/public/

exec "$@"
