# Multi-stage Dockerfile for frontend
# Build-time ARG VITE_API_URL will be baked into the built assets.
FROM node:18-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
