# Frontend Dockerfile for Playwright tests
FROM oven/bun:1 AS builder

WORKDIR /app

# Build argument for API URL
ARG REACT_APP_API_URL=http://localhost:9001

# Copy package files and install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source code
COPY . .

# Build the React app
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN bun run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
