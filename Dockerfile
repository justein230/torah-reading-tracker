FROM node:lts-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx tsc -p tsconfig.server.json
RUN npm ci --omit=dev --ignore-scripts && npm rebuild better-sqlite3

FROM node:lts-slim
WORKDIR /app
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/dist            ./dist
COPY --from=builder /app/dist-server     ./dist-server
COPY package.json schema.sql seed.db docker-entrypoint.sh ./
COPY drizzle ./drizzle
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000 \
    TORAH_HOST=0.0.0.0 \
    TORAH_DB_PATH=/data/torah.db

VOLUME ["/data"]
ENTRYPOINT ["./docker-entrypoint.sh"]
