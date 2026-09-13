#!/bin/sh
set -eu
node node_modules/prisma/build/index.js migrate deploy
node prisma/seed.mjs
exec node server.js
