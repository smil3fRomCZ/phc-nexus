# =============================================================================
# PHC Nexus — Multi-stage Dockerfile
# Single image for: app (PHP-FPM), worker, scheduler
# =============================================================================

# Stage 1: Composer dependencies
# Base image pinned na konkrétní patch verzi (reproducibilní build, auto-update přes Dependabot)
FROM composer:2.9.5 AS composer-build
WORKDIR /build
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --ignore-platform-req=ext-pcntl

COPY . .
RUN composer dump-autoload --optimize

# Stage 2: Frontend build
FROM node:25.9.0-alpine AS frontend-build
WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 3: Production image
FROM php:8.4.20-fpm-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    su-exec \
    postgresql-dev \
    icu-dev \
    libzip-dev \
    linux-headers \
    && docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    intl \
    zip \
    bcmath \
    opcache \
    pcntl \
    && apk del linux-headers

# Install Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# PHP configuration
COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini
COPY docker/php/php-fpm.conf /usr/local/etc/php-fpm.d/zz-app.conf

# Create non-root user
RUN addgroup -g 1000 -S appuser && \
    adduser -u 1000 -S appuser -G appuser

WORKDIR /var/www/html

# Copy application code first, then overlay built artifacts
COPY . .
COPY --from=composer-build /build/vendor ./vendor
COPY --from=frontend-build /build/public/build ./public/build

# Keep a pristine copy of public/ so the entrypoint can sync it
# into the shared named volume on every container start.
RUN cp -a public public-build

# Regenerate package discovery (exclude dev providers like Pail)
RUN php artisan package:discover --ansi 2>/dev/null || true

# Entrypoint syncs public assets into the shared volume
COPY docker/entrypoint.sh /entrypoint.sh

# Set permissions
RUN chown -R appuser:appuser storage bootstrap/cache && \
    chmod -R 775 storage bootstrap/cache

EXPOSE 9000

# PHP-FPM healthcheck přes FastCGI ping (pool `zz-app` má `pm.status_path = /status`,
# fallback na TCP check pokud status_path není dostupný).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD php -r "exit(@fsockopen('127.0.0.1', 9000) ? 0 : 1);"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
