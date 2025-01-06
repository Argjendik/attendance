# Migrate and generate Prisma client on release phase
release: cd backend && npm install --omit=dev && npm install -g prisma && npx prisma generate && npx prisma migrate deploy

# Main web process: just run the compiled NestJS app
web: cd backend && npm run start:prod
