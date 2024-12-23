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
FROM nginx:1.25

# Copy the built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx configuration
RUN echo 'daemon off;\n\
error_log stderr;\n\
events { worker_connections 1024; }\n\
http {\n\
    access_log /dev/stdout;\n\
    default_type application/octet-stream;\n\
    types { text/html html htm shtml; }\n\
    keepalive_timeout 30;\n\
    server {\n\
        listen $PORT;\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        location / {\n\
            try_files $uri $uri/ /index.html;\n\
            add_header Cache-Control "no-cache";\n\
        }\n\
        location /static/ {\n\
            expires 1y;\n\
            add_header Cache-Control "public";\n\
        }\n\
    }\n\
}' > /etc/nginx/nginx.conf.template

# Use envsubst to replace $PORT at runtime
CMD /bin/sh -c "envsubst '\$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx" 