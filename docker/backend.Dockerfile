# Backend Dockerfile for Playwright tests
FROM node:16.10.0

# Install dependencies for PDF generation
RUN apt-get update && \
    apt-get install -y build-essential libfontconfig pdftk && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create templates directory
RUN mkdir -p /app/templates

EXPOSE 9000

CMD ["node", "./public/server.js"]
