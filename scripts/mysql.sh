#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
mysql_prefix="${MYSQL_PREFIX:-/opt/homebrew/opt/mysql@8.4}"
mysql_socket="/private/tmp/food-delivery-mysql.sock"
if [[ ! -x "$mysql_prefix/bin/mysqld" ]]; then
  echo "MySQL 8.4 not found. Set MYSQL_PREFIX to its installation directory."
  exit 1
fi
case "${1:-start}" in
  start)
    if "$mysql_prefix/bin/mysqladmin" --no-defaults --socket="$mysql_socket" -u root ping >/dev/null 2>&1; then
      echo "Project MySQL is already running on port 3307."
      exit 0
    fi
    if [[ ! -d "$project_root/.local/mysql/mysql" ]]; then
      echo "No initialized project database. See README.md for first-time setup."
      exit 1
    fi
    "$mysql_prefix/bin/mysqld" --no-defaults --datadir="$project_root/.local/mysql" --port=3307 --bind-address=127.0.0.1 --socket="$mysql_socket" --mysqlx=OFF --pid-file="$project_root/.local/mysql.pid" --log-error="$project_root/.local/mysql.log" --daemonize
    echo "Project MySQL started on port 3307."
    ;;
  stop) "$mysql_prefix/bin/mysqladmin" --no-defaults --socket="$mysql_socket" -u root shutdown ;;
  status) "$mysql_prefix/bin/mysqladmin" --no-defaults --socket="$mysql_socket" -u root ping ;;
  *) echo "Usage: bash scripts/mysql.sh [start|stop|status]"; exit 1 ;;
esac
