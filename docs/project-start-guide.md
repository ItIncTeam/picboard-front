# Project Start Guide

Короткий onboarding для Picboard frontend.

## Проект

Picboard — web-приложение на Next.js App Router и TypeScript.

Сейчас в проекте уже есть:

- public routes;
- auth routes;
- protected routes;
- admin routes;
- route-based modal slot;
- базовые layout boundaries.

## Главная мысль

`app/` должен быть тонким.

Сначала фиксируем маршруты и layouts. Потом подключаем UI. Потом добавляем бизнес-логику.

## Что читать первым

- [App Router](./app-router-roadmap.md) — текущая карта маршрутов и layouts.
- [Architecture](./architecture.md) — правила слоев.
- [Границы слоев](./layer-ownership.md) — куда класть новый код.

## Локальная настройка

Этот документ — source of truth для локальной настройки проекта после `git clone`.

Установите зависимости:

```bash
pnpm install
```

Создайте `.env.local` на основе `.env.example`.

Обязательные переменные для локальной разработки:

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://gateway.picboard.space/api/v1
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```

Пример `.env.local`:

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://gateway.picboard.space/api/v1
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY
```

`NEXT_PUBLIC_GRAPHQL_ENDPOINT` нужен Apollo Client. Сейчас HTTP link использует:

```ts
process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '/graphql'
```

Если переменная не задана, браузер отправит GraphQL-запросы на:

```text
http://localhost:3000/graphql
```

Такой endpoint в frontend dev server не существует, поэтому запросы закончатся ошибкой:

```text
404 Not Found
```

`NEXT_PUBLIC_GRAPHQL_ENDPOINT` также используется для browser navigation на backend-owned Google
и GitHub OAuth start routes.

`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` — публичный frontend site key для Google reCAPTCHA v3.
`RECAPTCHA_SECRET_KEY` относится только к backend и не должен попадать во frontend.

После любого изменения `.env.local` перезапустите dev server:

```bash
pnpm dev
```

## Как писать page.tsx

```tsx
import { SignInPage } from '@/views/sign-in-page'

export default function Page() {
  return <SignInPage />
}
```

`page.tsx` не содержит формы, запросы и сложную верстку.

## Где писать auth UI

Подробная карта auth flow:

- [Auth Routes](./auth/auth-routes.md)
- [Auth Infrastructure](./auth/auth-infrastructure-plan.md)
- [Auth Session Architecture](./auth/auth-session-architecture.md)
- [Auth Backend Contract](./auth/auth-backend-contract.md)

Route:

```txt
src/app/(public)/auth/sign-in/page.tsx
```

Page composition:

```txt
src/views/sign-in-page
```

Общий auth shell:

```txt
src/widgets/public-auth-shell
```

Будущая форма:

```txt
src/features/auth
```

## Где писать layout UI

Переиспользуемый shell или header кладем в `widgets/`.

Route-level boundary остается в `app/.../layout.tsx`.

Пример сейчас:

```txt
app/(public)/layout.tsx -> widgets/public-header
app/(public)/layout.tsx -> widgets/public-auth-shell через views
```

## Modals

Route-based modal нужен, если контент должен открываться по URL.

Local modal нужен для маленьких UI-сценариев: confirm, dropdown, dialog.

Пока общий modal manager не нужен.

## Что не добавлять без отдельной задачи

- middleware;
- auth redirects;
- token handling;
- API layer;
- form state;
- validation;
- Zustand stores;
- временные компоненты дизайн-системы;
- global providers без реального потребителя.
