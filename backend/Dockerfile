# Use specific Node.js version
FROM node:18.19.0

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy all source files first
COPY . .

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Generate Prisma client and build
RUN npx prisma generate && \
    npm run build

# Start the server
CMD ["npm", "start"]

# Expose the port the app runs on
EXPOSE 3001