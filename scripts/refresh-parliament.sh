#!/bin/sh
# Refreshes public/parliament.json and pushes it when it changed. A computer in Malaysia (alarmpi) runs this from
# cron, because parlimen.gov.my does not answer cloud servers. See "Parliament" in README.md.
set -eu
cd "$(dirname "$0")/.."

git pull --quiet --ff-only
# Reinstall packages only when the lock file changed since the last install.
if ! cmp -s package-lock.json node_modules/.installed-lock; then
  npm ci --silent --no-audit --no-fund
  cp package-lock.json node_modules/.installed-lock
fi
mkdir -p node_modules/.cache
npm run --silent parliament

if git diff --quiet public/parliament.json; then
  exit 0
fi
git add public/parliament.json
git commit --quiet -m "Refresh Parliament data"
git push --quiet
