FROM node:22-alpine AS client-builder
WORKDIR /app
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=client-builder /app/dist /usr/share/nginx/html
EXPOSE 8443
