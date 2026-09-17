# Shija — food delivery MVP

A Laravel REST API and React storefront for Kosovo, with guest checkout, customer favorites/history, and a small admin workspace. No payment provider, Docker, or CI/CD is included.

## Run on this machine

PHP 8.5, Composer, Node, dependencies, and an isolated MySQL 8.4 instance have been configured. Development and test databases are separate. MariaDB remains untouched on its original port; this app uses **127.0.0.1:3307**.

```sh
npm run dev
```

Open **http://127.0.0.1:5173**. The API runs at **http://127.0.0.1:8000/api/v1**. Use the same `127.0.0.1` hostname throughout so session cookies work consistently. If these servers are already running, simply open the frontend rather than starting duplicates.

Use `npm run db:start` / `npm run db:stop` to control only the project database. `MYSQL_PREFIX` can override `/opt/homebrew/opt/mysql@8.4`. `NODE_BINARY` can override the Node executable used by the dev script. Ctrl+C stops the API and frontend started by the script; the database stays running.

The admin email is `admin@shija.test`; its local password is the `ADMIN_PASSWORD` value in `backend/.env`. Sign in normally to open the admin workspace. Public registration always creates a customer, even if a request includes an admin role.

## Verified stack

- PHP 8.5.9 / Laravel 13.32 / Sanctum 4.3
- MySQL 8.4.11; application database `food_delivery`, test database `food_delivery_test`
- Node 24.20 recommended (`.nvmrc`); Node 22.12+ is also supported
- React 19.3 / Vite 8.3 / Vitest 5 / PHPUnit 12.5
- Locked Composer and npm dependencies; frontend lives in `frontend/`, PHP in `backend/`

## Fresh checkout

1. Install PHP 8.3+ with the required extensions (PHP 8.5 is tested), Composer 2.10.3+, Node 24, and MySQL 8.4. Run `composer check-platform-reqs` after installing dependencies to verify your PHP version against the lockfile.
2. Run `composer install` in `backend/` and `npm ci` in `frontend/`.
3. Copy `backend/.env.example` to `backend/.env`; configure MySQL credentials, port, and a local `ADMIN_PASSWORD`. Create both databases and grant an application user access to them. Tests must use a disposable database: the suite refreshes `food_delivery_test`.
4. Run `php artisan key:generate`, then `php artisan migrate --seed` inside `backend/`.
5. Run `php artisan serve --host=127.0.0.1 --port=8000` in `backend/` and `npm run dev` in `frontend/`.

For the optional isolated macOS database used by the root dev script, install `mysql@8.4` without modifying MariaDB links, initialize `.local/mysql` with `mysqld --no-defaults --initialize-insecure --datadir="$PWD/.local/mysql"`, then use `scripts/mysql.sh`. The data directory and secrets are ignored by Git. Never point MySQL at MariaDB's data directory.

## Tests and build

```sh
npm test
npm run build
npm run format
# PHP formatting:
cd backend && vendor/bin/pint --dirty --format agent
```

Backend tests run against real MySQL, including authentication, admin permissions, menu CRUD, cart constraints, server-side prices, retry-safe checkout, order history isolation, and favorites. Unit tests cover phone normalization and integer-cent totals. Frontend tests cover filtering, cart controls, checkout, error handling, and admin editing. Browser checks cover real cookies/CSRF, guest order placement, customer registration/favorites/history, admin status changes and editing, and desktop/mobile layouts.

## API overview

All API endpoints return JSON. Mutations use CSRF-protected session cookies. Fetch `/sanctum/csrf-cookie` before mutations and send the `XSRF-TOKEN` cookie in `X-XSRF-TOKEN`. Protected routes use `auth:sanctum`; admin routes also enforce the admin role. Routes use Laravel's web session middleware intentionally; the resources remain REST endpoints with the `/api/v1` prefix.

| Endpoint | Methods | Access |
| --- | --- | --- |
| `/register`, `/login`, `/logout` | POST | Public registration/login; authenticated logout |
| `/user` | GET | Signed in |
| `/cities` | GET | Public |
| `/restaurants`, `/restaurants/{id}` | GET | Public |
| `/cart` | GET, DELETE | Guest or signed in, session-scoped |
| `/cart/items`, `/cart/items/{food}` | POST; PATCH, DELETE | Guest or signed in |
| `/orders` | POST | Guest or signed in |
| `/orders`, `/orders/{id}` | GET | Owner only |
| `/favorites` | GET | Signed in |
| `/favorites/{foods\|restaurants}/{id}` | PUT, DELETE | Signed in |
| `/admin/restaurants` | GET, POST | Admin |
| `/admin/restaurants/{id}` | PATCH, DELETE | Admin |
| `/admin/foods`, `/admin/foods/{id}` | POST; PATCH, DELETE | Admin |
| `/admin/orders`, `/admin/orders/{id}` | GET; PATCH | Admin |

Order statuses: `new`, `processing`, `on the way`, `done`. Admins may correct a status by selecting any supported value. Money is stored and calculated in integer euro cents. One session cart contains one restaurant; switching kitchens requires explicitly replacing the bag. An order stores price/name snapshots so later edits or deletions do not change its history. A retry with the same checkout key returns the existing order within that session.

Delivery address is a city/municipality selection, as requested: all 38 municipal centers are included. Phone input accepts common local formats and normalizes to `+383`. No street address or verification email is required. Guests provide contact information during checkout and receive an order reference. Guest orders are not retrospectively attached to accounts; signed-in orders appear in history. Favorites require an account. Cart state lasts for the browser session cookie lifetime (120 minutes of inactivity), and logging out clears the session/cart.

## Milestones

Branches are cumulative and remain separate for review; no merge to main was assumed.

1. `milestone/01-foundation-auth` — structure, dependencies, MySQL setup, Sanctum authentication
2. `milestone/02-restaurants-menu` — three seeded restaurants, 18 items, public API, storefront
3. `milestone/03-cart-orders-favorites` — cart, guest checkout, customer order history, favorites
4. `milestone/04-admin-integration` — admin CRUD/statuses, integration coverage, local scripts

Migrations are split into user profile, restaurants, food, orders, order items, and separate favorite pivot tables, alongside Laravel's framework infrastructure migrations.

Food photography is bundled locally from Unsplash; see `frontend/public/images/sources.json`. Illustrative photos represent menu categories rather than exact dishes. Google Fonts supplies Manrope and DM Sans, with local system fallbacks. Demo restaurant names and menus are fictional. Municipal coverage was checked against the [Kosovo Agency of Statistics](https://askdata.rks-gov.net/pxweb/en/ASKdata/ASKdata__Geographical%20data/geo02.px/).
