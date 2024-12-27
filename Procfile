release: cd backend && node ./node_modules/prisma/build/index.js migrate deploy && npm install && node ./node_modules/@nestjs/cli/bin/nest.js build
web: cd backend && node dist/main.js 