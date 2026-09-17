# Shija — Food Delivery

Laravel + React + MySQL MVP with guest checkout, favorites, order history, and an admin panel.

## Run with Docker

Install and start [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with Compose), then run:

```sh
git clone https://github.com/vlerejanaselmani/food-delivery.git
cd food-delivery
docker compose up --build -d --wait
```

Open **http://localhost:8080**.

**Admin:** `admin@shija.test` / `ShijaDemo2026!`

To upload a food photo: **Admin → Restaurants & menus → Edit item → Upload a photo → Save changes** (JPEG, PNG, or WebP, up to 5 MB).

Docker installs dependencies, builds React, starts MySQL, runs migrations, and seeds three restaurants with 18 menu items. No local PHP, Node, MySQL, or `.env` setup is needed. These credentials are for the local demo.

## Stop / restart

```sh
docker compose down
docker compose up -d --wait
```

Database data and the app key persist in Docker volumes. Restarts preserve menu edits, uploaded food photos, and orders. After pulling code changes, rerun `docker compose up --build -d --wait`.

## Tests / logs

```sh
docker compose --profile test run --build --rm tests
docker compose logs -f app
```

The test command runs backend tests against a separate database. Frontend tests run during the image build.
