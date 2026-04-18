FROM node:22-alpine AS builder
WORKDIR /repo
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci
COPY shared ./shared
COPY server/tsconfig.json ./server/
COPY server/src ./server/src
COPY server/prisma ./server/prisma
RUN npm --workspace @tg/shared run build
RUN cd server && npx prisma generate
RUN npm --workspace tainted-grail-server run build

FROM node:22-alpine
RUN apk add --no-cache postgresql-client
WORKDIR /app
COPY --from=builder /repo/package.json /repo/package-lock.json ./
COPY --from=builder /repo/shared/package.json ./shared/
COPY --from=builder /repo/shared/dist ./shared/dist
COPY --from=builder /repo/server/package.json ./server/
COPY --from=builder /repo/server/dist ./server/dist
COPY --from=builder /repo/server/prisma ./server/prisma
COPY --from=builder /repo/client/package.json ./client/
COPY server/migrations ./migrations
COPY server/entrypoint.sh ./
RUN chmod +x entrypoint.sh
RUN npm ci --omit=dev --ignore-scripts
RUN cd server && npx prisma generate
WORKDIR /app/server
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
