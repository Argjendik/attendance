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

# Remove the default Nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy a basic nginx configuration file
COPY <<EOF /etc/nginx/conf.d/default.conf.template
server {
    listen \${PORT:-8080};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Set environment variable with a default value
ENV PORT=8080

# Start Nginx
CMD /bin/sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'" 