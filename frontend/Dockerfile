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
FROM nginx:1.25-alpine

# Copy the built files to NGINX's default directory
COPY --from=build /app/dist /usr/share/nginx/html

# Default nginx configuration - create it first
RUN printf 'server {\n\
    listen 8080;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Create entrypoint script
RUN printf '#!/bin/sh\n\
set -e\n\
PORT="${PORT:-8080}"\n\
echo "Using port: $PORT"\n\
sed -i "s/listen 8080/listen $PORT/" /etc/nginx/conf.d/default.conf\n\
exec nginx -g "daemon off;"\n' > /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Set environment variable with a default value
ENV PORT=8080

# Use the entrypoint script
CMD ["/docker-entrypoint.sh"] 