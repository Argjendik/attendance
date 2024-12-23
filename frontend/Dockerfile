# Build stage
FROM node:18.19.0 as build

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and TypeScript config
COPY package*.json tsconfig*.json ./

# Install dependencies and TypeScript
RUN npm ci --ignore-scripts && \
    npm install -g typescript && \
    npm install typescript --save-dev && \
    npm install -g vite

# Ensure TypeScript binaries have proper permissions
RUN chmod -R 755 node_modules/.bin && \
    chmod -R 755 /usr/local/lib/node_modules

# Copy the rest of the application code
COPY . .

# Ensure proper permissions
RUN chmod -R 755 .

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

# Create a static.json file for Heroku
RUN echo '{\n\
  "root": ".",\n\
  "clean_urls": true,\n\
  "routes": {\n\
    "/**": "index.html"\n\
  },\n\
  "headers": {\n\
    "/**": {\n\
      "Cache-Control": "no-store, no-cache"\n\
    },\n\
    "/static/**": {\n\
      "Cache-Control": "public, max-age=31536000"\n\
    }\n\
  }\n\
}' > static.json

# Start serve
CMD serve -s . -l $PORT 