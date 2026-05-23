#Устанавливаем зависимости
FROM node:20-alpine AS dependencies
WORKDIR /app

#Включаем corepack и устанавливаем pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

#Копируем lock-файл и манифест пакетов
COPY pnpm-lock.yaml package.json ./
#Устанавливаем зависимости (prod + dev для билда)
RUN pnpm install --frozen-lockfile

#Билдим приложение
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

#Копируем исходники и установленные зависимости
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules

RUN pnpm build:production

#Стейдж запуска
FROM node:20-alpine AS runner
USER node
WORKDIR /app
ENV NODE_ENV=production

#Копируем только билд и production-зависимости
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000

CMD ["pnpm", "start"]