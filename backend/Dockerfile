# Use specific Node.js version
FROM node:18.19.0-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && \
    npm run build

# Start the server
CMD ["npm", "start"]

# Expose the port the app runs on
EXPOSE 3001