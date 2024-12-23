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

# Nginx stage
FROM nginx:1.25-alpine

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Make port 8080 available
EXPOSE 8080

# Start nginx with environment variable substitution
CMD /bin/sh -c "envsubst '\$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'" 