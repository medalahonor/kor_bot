FROM node:22-alpine AS client-builder
WORKDIR /repo
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci
COPY shared ./shared
RUN npm --workspace @tg/shared run build
COPY client ./client
RUN npm --workspace client run build

FROM nginx:alpine
COPY --from=client-builder /repo/client/dist /usr/share/nginx/html
EXPOSE 8443
