FROM node:22-alpine
WORKDIR /repo
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci
COPY shared ./shared
RUN npm --workspace @tg/shared run build
COPY client ./client
EXPOSE 5173
WORKDIR /repo/client
CMD ["npx", "vite", "--host"]
