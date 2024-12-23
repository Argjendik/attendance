# Use the latest LTS Node.js image
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# Install dependencies with unsafe permissions
RUN npm install --unsafe-perm

# Copy source code
COPY . .

# Set permissions and build the project
RUN chmod -R 755 . && \
    npm run build --unsafe-perm && \
    npx prisma generate

# Production stage
FROM node:20-slim

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