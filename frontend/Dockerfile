# Multi-stage Dockerfile for frontend (build with Vite, serve with nginx)
FROM node:18-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Runtime: use nginx to serve static files
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
