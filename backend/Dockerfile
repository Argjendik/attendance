# Build stage
FROM node:18-slim AS build

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Create app user and set up directories
RUN mkdir -p /home/nestjs/.npm && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nestjs nestjs && \
    chown -R nestjs:nodejs /app && \
    chown -R nestjs:nodejs /home/nestjs

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Install dependencies as root
RUN npm ci && \
    chown -R nestjs:nodejs /app

# Switch to app user
USER nestjs

# Copy the rest of the application code
COPY --chown=nestjs:nodejs . .

# Clean dist directory and generate build
RUN npm run build && \
    npx prisma generate

# Production stage
FROM node:18-slim

# Create app user and set up directories
RUN mkdir -p /home/nestjs/.npm && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nestjs nestjs

WORKDIR /app

# Copy built files and dependencies
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/tsconfig*.json ./

# Set ownership
RUN chown -R nestjs:nodejs /app && \
    chown -R nestjs:nodejs /home/nestjs

# Switch to app user
USER nestjs

# Expose port
EXPOSE 3001

# Start the server using the built files
CMD ["npm", "run", "start:prod"]