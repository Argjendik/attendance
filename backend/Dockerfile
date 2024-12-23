# Build stage
FROM node:18-slim AS build

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# Install dependencies with npm ci
RUN npm ci

# Copy the rest of the application code
COPY . .

# Ensure TypeScript and other binaries have executable permissions
RUN chmod -R 755 node_modules/.bin && \
    chmod -R 755 .

# Generate Prisma client and build
RUN npx prisma generate && \
    npx tsc && \
    npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Copy built files and dependencies
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma

# Set correct permissions in production image
RUN chmod -R 755 .

# Expose port
EXPOSE 3001

# Start the server using the built files
CMD ["node", "dist/main.js"]