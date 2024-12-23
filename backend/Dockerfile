# Use specific Node.js version
FROM node:18.19.0

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to avoid npm ci issues
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && \
    npm run build

# Start the server
CMD ["npm", "start"]

# Expose the port the app runs on
EXPOSE 3001