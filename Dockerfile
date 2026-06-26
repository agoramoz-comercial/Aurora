# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files and build
COPY . .
RUN npm run build

# Stage 2: Serve stage with Nginx
FROM nginx:1.25-alpine

# Copy Nginx server configuration for single-page routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
