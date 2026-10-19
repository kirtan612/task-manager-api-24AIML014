# Stage 1: Build the React Application
FROM node:18-alpine AS build
WORKDIR /app

# Copy package descriptors for cached layer resolution
COPY package*.json ./
RUN npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Expose Vite preview port
EXPOSE 5173

# Serve built production assets with host binding for Docker networking
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
