release: cd backend && node ./node_modules/prisma/build/index.js migrate deploy
web: cd /app/backend && npm install && node ./node_modules/@nestjs/cli/bin/nest.js build && node dist/main.js 