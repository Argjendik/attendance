# Build stage
FROM node:18.19.0-alpine as build

# Set working directory
WORKDIR /app

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
FROM node:18.19.0-alpine

# Install serve to host the static files
RUN npm install -g serve

# Create app directory
WORKDIR /app

# Copy built files from build stage
COPY --from=build /app/dist .

# Set environment variable with a default value
ENV PORT=8080

# Start the server
CMD serve -s . -l $PORT 