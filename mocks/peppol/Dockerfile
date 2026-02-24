FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY server.js ./

EXPOSE 3002

CMD ["bun", "start"]
