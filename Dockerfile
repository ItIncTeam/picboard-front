#Устанавливаем зависимости
FROM node:22.11-alpine as dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts

#Билдим приложение
#Кэширование зависимостей — если файлы в проекте изменились,
#но package.json остался неизменным, то стейдж с установкой зависимостей повторно не выполняется, что экономит время.
FROM node:22.11-alpine as builder
WORKDIR /app
ARG NEXT_PUBLIC_GRAPHQL_ENDPOINT
ENV NEXT_PUBLIC_GRAPHQL_ENDPOINT=$NEXT_PUBLIC_GRAPHQL_ENDPOINT
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm run build:production

#Стейдж запуска
FROM node:22.11-alpine as runner
USER node
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/ ./
EXPOSE 4310
CMD ["npm", "start"]
