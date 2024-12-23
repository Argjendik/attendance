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

# Create a simple nginx configuration
RUN echo 'server {\n\
    listen $PORT;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf.template

# Use envsubst to replace $PORT at runtime and start nginx
CMD /bin/sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'" 