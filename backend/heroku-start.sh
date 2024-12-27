#!/bin/bash
cd /app/backend
npm install
node ./node_modules/@nestjs/cli/bin/nest.js build
node dist/main.js 