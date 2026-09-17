# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm test && npm run build

FROM php:8.5-apache-bookworm AS backend
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/html
ENV COMPOSER_ALLOW_SUPERUSER=1
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction
COPY backend/ ./
RUN touch .env \
    && composer dump-autoload --no-dev --optimize --no-interaction \
    && composer check-platform-reqs --no-dev
COPY --from=frontend /build/frontend/dist/ ./public/
COPY docker/php.ini /usr/local/etc/php/conf.d/uploads.ini
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/shija-entrypoint
RUN chmod +x /usr/local/bin/shija-entrypoint \
    && chown -R www-data:www-data storage bootstrap/cache
EXPOSE 80
ENTRYPOINT ["shija-entrypoint"]
CMD ["apache2-foreground"]

FROM backend AS test
RUN composer install --prefer-dist --no-interaction
ENTRYPOINT ["php", "artisan"]
CMD ["test", "--compact"]

FROM backend AS app
