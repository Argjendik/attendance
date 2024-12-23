# Build stage
FROM node:18-slim AS build

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

# Install dependencies with npm ci and set correct permissions
RUN npm ci && \
    chmod -R 777 node_modules/.bin

# Copy the rest of the application code
COPY . .

# Generate Prisma client and build the application
RUN npm run build && \
    npx prisma generate

# Production stage
FROM node:18-slim

WORKDIR /app

# Copy built files and dependencies
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/tsconfig*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    chmod -R 777 node_modules/.bin

# Set correct permissions in production image
RUN chmod -R 755 .

# Expose port
EXPOSE 3001

# Start the server using the built files
CMD ["npm", "run", "start:prod"]