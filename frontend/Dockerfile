# Build stage
FROM node:18.19.0 as build

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy only package files and install dependencies first (to cache this layer)
COPY package*.json tsconfig*.json ./
RUN npm ci --ignore-scripts && \
    npm install -g typescript vite && \
    npm install typescript --save-dev

# Copy the rest of the application code
COPY . .

# Build the application
RUN npx tsc && \
    npx vite build

# Production stage
FROM node:18.19.0-slim

# Create app directory
WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy built files from build stage
COPY --from=build /app/dist .

# Start serve
CMD serve -s . -l $PORT 