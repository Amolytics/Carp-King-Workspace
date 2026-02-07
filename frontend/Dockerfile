# Multi-stage Dockerfile for frontend (build with Vite, serve with nginx)
FROM node:18-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY package*.json ./
# install build tools required by some native deps (esbuild, node-gyp, etc.)
# then install dependencies
RUN apk add --no-cache build-base python3 git
RUN npm ci --loglevel verbose
COPY . .
RUN npm run build

# Runtime: use nginx to serve static files
FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
# Install a tiny static file server (serve) and run it. Using a Node runtime
# ensures `npx`/npm tools are available if Railway injects runtime commands.
RUN npm install -g serve
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
