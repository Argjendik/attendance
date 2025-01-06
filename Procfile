# Migrate and generate Prisma client on release phase
release: cd backend && npm run prisma:deploy && node dist/create-admin.js

# Main web process: just run the compiled NestJS app
web: cd backend && node dist/main.js
