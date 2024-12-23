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

# Create a custom nginx configuration
RUN echo 'worker_processes auto;\n\
daemon off;\n\
\n\
events {\n\
    worker_connections 1024;\n\
}\n\
\n\
http {\n\
    include /etc/nginx/mime.types;\n\
    default_type application/octet-stream;\n\
\n\
    sendfile on;\n\
    tcp_nopush on;\n\
    tcp_nodelay on;\n\
    keepalive_timeout 65;\n\
    types_hash_max_size 2048;\n\
\n\
    server {\n\
        listen ${PORT:-8080};\n\
        server_name _;\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
\n\
        location / {\n\
            try_files $uri $uri/ /index.html;\n\
        }\n\
\n\
        location ~* \\.(?:css|js|jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc)$ {\n\
            expires 1M;\n\
            access_log off;\n\
            add_header Cache-Control "public";\n\
        }\n\
    }\n\
}' > /etc/nginx/nginx.conf.template

# Use envsubst to replace $PORT at runtime and start nginx
CMD /bin/sh -c "envsubst '\$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx" 