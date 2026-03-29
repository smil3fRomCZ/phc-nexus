#!/bin/sh
set -e

# Sync built public assets into the shared named volume.
# Runs as root so it can write to the volume regardless of ownership.
rm -rf /var/www/html/public/*
cp -r /var/www/html/public-build/. /var/www/html/public/

# PHP-FPM master needs root to bind port and fork workers as appuser
# (configured via user/group in php-fpm.conf pool).
exec "$@"
