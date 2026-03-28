# =============================================================================
# PHC Nexus — Multi-stage Dockerfile
# Single image for: app (PHP-FPM), worker, scheduler
# =============================================================================

# Stage 1: Composer dependencies
FROM composer:2 AS composer-build
WORKDIR /build
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --ignore-platform-req=ext-pcntl

COPY . .
RUN composer dump-autoload --optimize

# Stage 2: Frontend build
FROM node:22-alpine AS frontend-build
WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 3: Production image
FROM php:8.4-fpm-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
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

# Set permissions
RUN chown -R appuser:appuser storage bootstrap/cache && \
    chmod -R 775 storage bootstrap/cache

USER appuser

EXPOSE 9000

CMD ["php-fpm"]
