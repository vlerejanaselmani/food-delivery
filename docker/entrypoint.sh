#!/bin/sh
set -eu
cd /var/www/html
mkdir -p storage/app/docker storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
# Persist the key with the app volume so container replacement keeps sessions valid.
if [ ! -s storage/app/docker/app-key ]; then
    php -r 'echo "base64:".base64_encode(random_bytes(32));' > storage/app/docker/app-key
fi
export APP_KEY="$(cat storage/app/docker/app-key)"
php artisan storage:link --force --no-interaction
php artisan migrate --force --no-interaction
# Seed once; restarting must not overwrite menu changes made by the admin.
if [ ! -f storage/app/docker/seeded ]; then
    php artisan db:seed --force --no-interaction
    touch storage/app/docker/seeded
fi
chown -R www-data:www-data storage bootstrap/cache
exec docker-php-entrypoint "$@"
