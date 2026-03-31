#!/bin/sh
set -e

# Sync built public assets into the shared named volume.
# Runs as root so it can write to the volume regardless of ownership.
rm -rf /var/www/html/public/*
cp -r /var/www/html/public-build/. /var/www/html/public/

# Fix storage permissions on every start — named volumes may lose
# ownership after re-creation or image updates.
chown -R appuser:appuser /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# PHP-FPM master needs root to bind port and fork workers as appuser
# (configured via user/group in php-fpm.conf pool).
exec "$@"
