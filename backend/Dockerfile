# FlowFox Backend - Development Dockerfile
# Uses Node.js 20 Alpine with ts-node-dev for hot reload

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose backend server port
EXPOSE 4000

# Set environment to development
ENV NODE_ENV=development

# Start development server with hot reload using ts-node-dev
CMD ["npm", "run", "dev"]
