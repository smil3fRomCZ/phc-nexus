#!/bin/sh
set -e

# Sync built public assets into the shared named volume.
# Runs as root so it can write to the volume regardless of ownership.
rm -rf /var/www/html/public/*
cp -r /var/www/html/public-build/. /var/www/html/public/

# Fix storage permissions on every start — named volumes may lose
# ownership after re-creation or image updates. Best-effort: když prod
# compose drop-uje CAP_CHOWN (security hardening), chown failne, ale
# volume už má správné ownership z předchozího bootu — pokračujeme dál.
chown -R appuser:appuser /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# PHP-FPM master needs root to bind port and fork workers as appuser
# (configured via user/group in php-fpm.conf pool).
exec "$@"
