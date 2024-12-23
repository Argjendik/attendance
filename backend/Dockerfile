# Build stage
FROM node:18-slim AS build

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Install dependencies and global tools
RUN npm ci && \
    npm install -g prisma @nestjs/cli && \
    chmod -R 755 /usr/local/lib/node_modules

# Add node_modules/.bin to PATH and fix permissions
ENV PATH="/app/node_modules/.bin:/usr/local/lib/node_modules:$PATH"
RUN chmod -R 755 node_modules/.bin

# Copy the rest of the application code
COPY . .

# Generate Prisma client and build the application
RUN prisma generate && \
    nest build

# Production stage
FROM node:18-slim

WORKDIR /app

# Copy built files and dependencies
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/tsconfig*.json ./

# Set correct permissions
RUN chmod -R 755 .

# Expose port
EXPOSE 3001

# Start the server using the built files
CMD ["npm", "run", "start:prod"]