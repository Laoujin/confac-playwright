FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY server.js ./

EXPOSE 3001

CMD ["bun", "start"]
