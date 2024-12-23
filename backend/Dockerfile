# Build stage
FROM node:18.19.0 AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# Install dependencies without running scripts
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npm run build && \
    npx prisma generate

# Production stage
FROM node:18.19.0-slim

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]