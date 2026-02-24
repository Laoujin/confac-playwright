# Backend Dockerfile for Playwright tests
FROM oven/bun:1-debian

# Install dependencies for PDF generation
RUN apt-get update && \
    apt-get install -y build-essential libfontconfig pdftk && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source code
COPY . .

# Build TypeScript
RUN bun run build

# Create templates directory
RUN mkdir -p /app/templates

EXPOSE 9000

CMD ["bun", "run", "./public/server.js"]
