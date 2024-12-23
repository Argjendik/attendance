# Build stage
FROM node:18-slim AS build

# Set working directory
WORKDIR /app

# Create app user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Switch to app user
USER nestjs

# Copy package files and install dependencies
COPY --chown=nestjs:nodejs package*.json ./
COPY --chown=nestjs:nodejs tsconfig*.json ./
COPY --chown=nestjs:nodejs prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY --chown=nestjs:nodejs . .

# Clean dist directory and generate build
RUN npm run build && \
    npx prisma generate

# Production stage
FROM node:18-slim

# Create app user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy built files and dependencies
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/tsconfig*.json ./

# Switch to app user
USER nestjs

# Expose port
EXPOSE 3001

# Start the server using the built files
CMD ["npm", "run", "start:prod"]