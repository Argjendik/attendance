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
FROM nginx:alpine

# Copy the built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

# Create a custom nginx configuration that uses $PORT
RUN echo 'server { \n\
    listen $PORT; \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html index.htm; \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
}' > /etc/nginx/conf.d/default.conf.template

# Set proper permissions for nginx directories
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to nginx user
USER nginx

# Use envsubst to replace $PORT at runtime
CMD /bin/sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'" 