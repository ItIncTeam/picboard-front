#Устанавливаем зависимости
FROM node:22-alpine AS dependencies
WORKDIR /app

#Включаем corepack и устанавливаем pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

#Копируем lock-файл и манифест пакетов
COPY pnpm-lock.yaml package.json ./

#Копируем scripts для prepare lifecycle
COPY scripts ./scripts

#Устанавливаем зависимости (prod + dev для билда)
RUN pnpm install --frozen-lockfile --ignore-scripts

#Билдим приложение
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

#Копируем исходники и установленные зависимости
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules

RUN pnpm build:production

#Стейдж запуска
FROM node:22-alpine AS runner
USER node
WORKDIR /app

ENV NODE_ENV=production

# Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["pnpm", "start"]