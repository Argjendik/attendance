# Build stage
FROM node:18.19.0 AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# Install dependencies with unsafe-perm flag
RUN npm install --unsafe-perm

# Copy source code
COPY . .

# Ensure proper permissions and run build steps
RUN chmod -R 755 . && \
    npm run build && \
    npx prisma generate

# Production stage
FROM node:18.19.0-slim

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

# Start the server
CMD ["npm", "start"]