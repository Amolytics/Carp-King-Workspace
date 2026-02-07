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

# Runtime: use a small Node server to serve static files and log requests
FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js
RUN npm install express@4 --no-save
EXPOSE 3000
CMD ["node", "server.js"]
