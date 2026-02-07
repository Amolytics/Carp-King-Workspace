FROM node:18-slim

WORKDIR /usr/src/app

# Install deps, build, then remove dev deps for smaller runtime image
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
RUN npm prune --production || true

# Add entrypoint which restarts the app with backoff if it crashes
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
