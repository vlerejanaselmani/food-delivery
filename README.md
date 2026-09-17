# Shija — food delivery MVP

A Laravel REST API and React storefront for Kosovo, with guest checkout, customer favorites/history, and a small admin workspace. No payment provider, Docker, or CI/CD is included.

## Requirements

Use the following versions for the tested setup:

| Tool | Version |
| --- | --- |
| PHP | 8.5.x (tested with 8.5.9) |
| Composer | 2.10.3 or newer |
| Node.js | 24.x (24.20.0 is pinned in `.nvmrc`); 22.12+ within Node 22 also works |
| MySQL | 8.4.x |
| Git | Any current version |

PHP needs the MySQL PDO driver and standard Laravel extensions, including `ctype`, `curl`, `dom`, `fileinfo`, `filter`, `hash`, `mbstring`, `openssl`, `pcre`, `pdo`, `session`, `tokenizer`, and `xml`. Composer checks the exact requirements of the locked packages.

Check your active tools before installing dependencies:

```sh
php --version
composer --version
node --version
npm --version
mysql --version
```

The backend uses Laravel 13 and Sanctum; the frontend uses React 19 and Vite 8. Install dependencies from the committed lockfiles with `composer install` and `npm ci`, rather than updating them during setup.

## Installation

### 1. Clone the repository

```sh
git clone https://github.com/vlerejanaselmani/food-delivery.git
cd food-delivery
git switch main
```

If you use nvm, select the pinned Node version from the repository root:

```sh
nvm install
nvm use
```

The folder structure is:

```text
food-delivery/
├── backend/       Laravel API, migrations, seeders, and PHPUnit tests
├── frontend/      React app, static assets, and Vitest tests
├── scripts/       Optional local MySQL and combined startup helpers
└── package.json   Commands that run the backend/frontend tools
```

### 2. Install dependencies

Run these commands from the repository root:

```sh
cd backend
composer install
composer check-platform-reqs
cp .env.example .env
cd ../frontend
npm ci
cd ..
```

Copy `.env.example` only for a fresh installation; keep an existing `.env` when updating the app. There are no root npm dependencies to install. On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed.

### 3. Create the MySQL databases

Start your MySQL server using its normal service manager. Connect with a MySQL administrator account. For a standard server on port 3306:

```sh
mysql -h 127.0.0.1 -P 3306 -u root -p
```

Run the following SQL once on a fresh database server. Replace `choose-a-local-db-password` with your own local password:

```sql
CREATE DATABASE food_delivery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE food_delivery_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'food_app'@'localhost' IDENTIFIED BY 'choose-a-local-db-password';
GRANT ALL PRIVILEGES ON food_delivery.* TO 'food_app'@'localhost';
GRANT ALL PRIVILEGES ON food_delivery_test.* TO 'food_app'@'localhost';
EXIT;
```

If these databases and the account already exist, use their existing credentials instead. `food_delivery_test` must be a separate, disposable database: the backend test suite recreates its tables.

### 4. Configure the backend

Edit `backend/.env` to match your MySQL installation:

```dotenv
APP_NAME=Shija
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=food_delivery
DB_USERNAME=food_app
DB_PASSWORD="choose-a-local-db-password"

SESSION_DRIVER=database
SESSION_DOMAIN=null
CACHE_STORE=database

ADMIN_EMAIL=admin@shija.test
ADMIN_PASSWORD="choose-a-local-admin-password"
```

The supplied `.env.example` defaults to **3307** for the isolated database on the original development machine. Change it to **3306** for a standard MySQL installation, or to your server's actual port. Set `ADMIN_PASSWORD` before seeding; an empty value skips admin creation. Environment files and database data are excluded from Git.

The frontend needs no `.env` file for local development. Vite forwards `/api` and `/sanctum` requests to the Laravel server on port 8000.

### 5. Create the application key and seed the menu

```sh
cd backend
php artisan key:generate
php artisan migrate --seed
cd ..
```

This creates the tables, the configured admin account, and three demo restaurants with six menu items each. Migrations are separated by entity. Generate the application key once during initial setup; keep it when restarting or updating the app.

## Running the app

### Standard setup: two terminals

Keep MySQL running, then open two terminals at the repository root.

**Terminal 1 — Laravel API:**

```sh
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

**Terminal 2 — React frontend:**

```sh
cd frontend
npm run dev
```

Open **http://127.0.0.1:5173**. The API base URL is **http://127.0.0.1:8000/api/v1**; **http://127.0.0.1:8000/up** is its health endpoint. Keep both terminals open and stop each server with Ctrl+C when finished.

Use `127.0.0.1` consistently rather than mixing it with `localhost`, so authentication and cart cookies stay on the same hostname. Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env` to open the admin workspace. Customer accounts can be created through the storefront; guests can order without registering.

### Existing project setup: one command

On the original development machine, dependencies and an isolated MySQL 8.4 instance are already configured. From the repository root:

```sh
npm run dev
```

This starts the project database on **127.0.0.1:3307**, Laravel on **8000**, and Vite on **5173**. It uses Node 24.20.0 from nvm when available, falling back to the active `node` executable. Ctrl+C stops the API and frontend started by this command; MySQL remains running.

```sh
npm run db:start
npm run db:stop
```

These helpers control only the isolated project database. They assume the macOS layout described below; use the two-terminal instructions for a standard MySQL service or other operating systems. If servers are already running, open the app instead of starting duplicates.

### Optional: isolated MySQL on macOS

The project helper uses `/opt/homebrew/opt/mysql@8.4` and stores data in `.local/mysql`. It keeps the app database separate from an existing MariaDB installation. With MySQL 8.4 binaries installed, initialize this directory **once**, from the repository root:

```sh
mkdir -p .local/mysql
/opt/homebrew/opt/mysql@8.4/bin/mysqld --no-defaults --initialize-insecure --datadir="$PWD/.local/mysql"
npm run db:start
/opt/homebrew/opt/mysql@8.4/bin/mysql --no-defaults --socket=/private/tmp/food-delivery-mysql.sock -u root
```

Run the database/account creation SQL from installation step 3 in that client, then use `DB_PORT=3307` in `backend/.env`. This local initialization creates a passwordless root account for the helper scripts. Do not initialize an existing data directory or point MySQL at MariaDB's data directory.

Set `MYSQL_PREFIX` if the MySQL installation is elsewhere; set `NODE_BINARY` to override the Node executable used by the combined startup script. The socket location is fixed to `/private/tmp/food-delivery-mysql.sock`.

## Tests, build, and formatting

Run commands below from the repository root after installing both sets of dependencies:

| Command | Purpose |
| --- | --- |
| `npm test` | Run all backend and frontend tests |
| `npm run test:backend` | Run PHPUnit tests against MySQL |
| `npm run test:frontend` | Run Vitest component/unit tests |
| `npm run build` | Build React assets into `frontend/dist/` |
| `npm run format` | Format the frontend source |
| `npm --prefix frontend run format:check` | Check frontend formatting without edits |

MySQL must be running for backend tests. `backend/phpunit.xml` selects `food_delivery_test`; the host, port, username, and password come from the backend environment. Never replace the test database name with a database containing data you want to keep.

For PHP formatting:

```sh
cd backend
vendor/bin/pint --dirty --format agent
```

The build command creates frontend assets only; it does not start the app or deploy the Laravel API. Use the development servers above for the local MVP. No Redis server, queue worker, mail service, or payment credentials are needed for the implemented workflows.

## Updating an existing installation

With a clean working tree, pull the latest code and install the locked dependencies:

```sh
git switch main
git pull --ff-only
cd backend
composer install
php artisan migrate
php artisan optimize:clear
cd ../frontend
npm ci
cd ..
```

Restart the development servers afterward. Keep your existing `.env` and application key. Seeding is intended for initial/demo setup: rerunning the menu seeder updates seeded menu values, so do not rerun it to preserve admin edits.

## Troubleshooting

- **Database connection refused:** start MySQL and check `DB_HOST`/`DB_PORT`. The isolated helper uses 3307; ordinary installations usually use 3306.
- **Access denied or unknown database:** check that the databases exist, the application user has grants, and `.env` matches the credentials you created.
- **Missing application key:** run `php artisan key:generate` inside `backend/` for a fresh installation.
- **No admin login:** set `ADMIN_PASSWORD` in `.env`, then run `php artisan db:seed --class=AdminSeeder` inside `backend/`. This creates or updates the configured admin.
- **419 / CSRF token mismatch:** use the frontend at `127.0.0.1:5173`, keep Laravel running at `127.0.0.1:8000`, and reload the page. Leave `SESSION_DOMAIN=null` for this local setup.
- **Port already in use:** stop an existing copy of the development server. If you deliberately change Laravel's port, update the proxy targets in `frontend/vite.config.js` too.
- **PHP or Node version errors:** verify the active executables with the version commands above. Run `nvm use` when using nvm, and use `composer check-platform-reqs` to identify missing PHP extensions or version requirements.
- **Changed `.env` settings are ignored:** run `php artisan optimize:clear` inside `backend/` and restart the API.

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

All four cumulative milestones are merged into `main`. The milestone branches remain available as development checkpoints.

1. `milestone/01-foundation-auth` — structure, dependencies, MySQL setup, Sanctum authentication
2. `milestone/02-restaurants-menu` — three seeded restaurants, 18 items, public API, storefront
3. `milestone/03-cart-orders-favorites` — cart, guest checkout, customer order history, favorites
4. `milestone/04-admin-integration` — admin CRUD/statuses, integration coverage, local scripts

Migrations are split into user profile, restaurants, food, orders, order items, and separate favorite pivot tables, alongside Laravel's framework infrastructure migrations.

Food photography is bundled locally from Unsplash; see `frontend/public/images/sources.json`. Illustrative photos represent menu categories rather than exact dishes. Google Fonts supplies Manrope and DM Sans, with local system fallbacks. Demo restaurant names and menus are fictional. Municipal coverage was checked against the [Kosovo Agency of Statistics](https://askdata.rks-gov.net/pxweb/en/ASKdata/ASKdata__Geographical%20data/geo02.px/).
