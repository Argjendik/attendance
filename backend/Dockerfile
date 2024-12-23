# Build stage
FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Install dependencies, TypeScript, and Prisma
RUN npm ci && \
    npm install -g typescript prisma && \
    npm install typescript --save-dev

# Ensure TypeScript and other binaries have proper permissions
RUN chmod -R 755 node_modules/.bin

# Copy source code
COPY . .

# Ensure proper permissions for all files
RUN chmod -R 755 .

# Generate Prisma client with unsafe permissions
RUN npx --unsafe-perm prisma generate

# Verify TypeScript installation and build
RUN npx tsc --version && \
    npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Set correct permissions in production image
RUN chmod -R 755 .

# Expose port
EXPOSE 3001

# Start the server using the built files
CMD ["node", "dist/main.js"]