# Base image with Node.js 18 (Alpine for reduced image attack surface and size)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install clean production dependencies
RUN npm install

# Copy application source code (excluding files in .dockerignore)
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
