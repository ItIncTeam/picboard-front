# Next.js App Router Architecture Roadmap

Это рабочий roadmap по App Router architecture для Picboard.

Здесь держим всё, что влияет на routing и layout boundaries:

- финальная route structure;
- этапы реализации;
- layout strategy;
- auth-first roadmap;
- modal strategy;
- provider strategy;
- FSD boundaries;
- implementation order;
- архитектурные ограничения и anti-patterns.

## Цель

Сначала приводим в порядок App Router и routing foundation.

И только потом берёмся за:

- полноценному UI;
- API;
- business logic;
- realtime;
- data layer.

Главное правило:

> Сначала route/layout boundaries → потом feature implementation.

---

# Архитектурные Принципы

## App layer держим thin

`src/app` отвечает за:

- routing;
- layouts;
- route groups;
- params/searchParams;
- redirects;
- metadata;
- modal slots;
- auth boundaries.

В `app/` не должно быть:

- business logic;
- form state;
- API logic;
- feature logic;
- reusable UI.

---

## FSD responsibilities

```txt
app       -> routing/infrastructure
views     -> page composition
widgets   -> large UI blocks
features  -> user actions
entities  -> business entities
shared    -> reusable infrastructure
```

---

# Финальная Route Structure

```txt
src/app/
  layout.tsx
  page.tsx
  not-found.tsx

  [locale]/
    layout.tsx

    (public)/
      layout.tsx
      page.tsx

      auth/
        sign-in/
        sign-up/
        forgot-password/
        privacy-policy/
        terms/

    (protected)/
      layout.tsx

      (main)/
        layout.tsx

        @modal/
          default.tsx
          [...catchAll]/page.tsx

        main/
        feed/
        messenger/
        search/
        favorites/
        statistics/

        profile/
          [userId]/
            followers/
            subscriptions/

        settings/
          layout.tsx
          profile/
          account/
          devices/
          notifications/

        posts/
          create/
          [postId]/

      admin/
        layout.tsx
        users/
        statistics/
        payments/
        posts/
```

---

# ЭТАП 1 — Routing Foundation

## Цель

Собрать стабильные App Router boundaries до того, как начнём делать реальные экраны.

## Что Делаем

### 1. Добавить все route-level layouts

Создать:

```txt
src/app/[locale]/layout.tsx
src/app/[locale]/(public)/layout.tsx
src/app/[locale]/(protected)/layout.tsx
src/app/[locale]/(protected)/(main)/layout.tsx
src/app/[locale]/(protected)/(main)/settings/layout.tsx
src/app/[locale]/(protected)/admin/layout.tsx
```

На этом этапе layouts могут быть placeholder-only. Это нормально.

Пример:

```tsx
export default function Layout({ children }: Props) {
  return <>{children}</>
}
```

---

### 2. Добавить modal infrastructure

Создать:

```txt
src/app/[locale]/(protected)/(main)/@modal/default.tsx
src/app/[locale]/(protected)/(main)/@modal/[...catchAll]/page.tsx
```

На этом этапе modals ещё не реализуем.

---

### 3. Нормализовать profile routes

Использовать:

```txt
/profile/[userId]/followers
/profile/[userId]/subscriptions
```

Не использовать плоские profile child routes без `[userId]`.

---

### 4. Зафиксировать locale strategy

Определить:

- supported locales;
- default locale;
- behavior для unknown locale.

---

### 5. Сделать pages thin

Все `page.tsx` должны быть routing adapters.

Пример:

```tsx
import { FeedPage } from '@/views/feed-page'

export default function Page() {
  return <FeedPage />
}
```

---

# ЭТАП 2 — Auth Foundation

## Первый полноценный feature module проекта

После routing foundation первым делаем полный auth flow.

## Почему auth идёт первым

Auth задаёт:

- protected boundaries;
- session strategy;
- redirects;
- middleware behavior;
- app shell transitions;
- access rules.

Без auth protected app всё равно придётся переделывать.

---

# Что Делаем На Этапе Auth

## Public auth pages

```txt
/auth/sign-in
/auth/sign-up
/auth/forgot-password
/auth/terms
/auth/privacy-policy
```

---

## Auth layouts

Добавляем visual shell для:

```txt
(public)/layout.tsx
```

---

## Protected boundary

Настраиваем:

```txt
(protected)/layout.tsx
```

Ответственность:

- session reading;
- redirect unauthenticated users;
- future role checks.

---

## Auth feature structure

```txt
features/
  auth/
    api/
    model/
    ui/
    lib/
```

---

## Auth views

```txt
views/
  sign-in-page/
  sign-up-page/
  forgot-password-page/
```

---

## Shared auth UI

```txt
shared/ui/
  Button/
  Input/
  Checkbox/
  Card/
  Typography/
```

---

# ЭТАП 3 — Main App Shell

## Что трогаем

```txt
(protected)/(main)/layout.tsx
```

## Main responsibilities

- Sidebar;
- Header;
- Mobile navigation;
- Notifications slot;
- Modal slot.

---

## Widgets

```txt
widgets/
  main-sidebar/
  app-header/
  mobile-navigation/
```

---

# ЭТАП 4 — Core Pages

После auth и shell переходим к:

```txt
feed
profile
search
favorites
settings
```

---

# ЭТАП 5 — Modal Routing

Добавляем только после появления реального UI.

## Intercepted routes

```txt
@modal/(..)posts/[postId]
@modal/(..)posts/create
```

---

# ЭТАП 6 — Messenger

Messenger держим отдельным этапом.

Причина:

- realtime;
- websocket;
- split layouts;
- optimistic updates.

Messenger не должен определять раннюю архитектуру проекта.

---

# ЭТАП 7 — Admin Panel

Делаем после stabilization main app.

## Routes

```txt
admin/users
admin/payments
admin/statistics
admin/posts
```

---

## Admin shell

```txt
(protected)/admin/layout.tsx
```

Ответственность:

- admin sidebar;
- role guard;
- admin navigation.

---

# Modal Strategy

## Route-based modals

Используются для:

- post details;
- create post;
- followers/subscriptions;
- shareable entity content.

---

## Local state modals

Используются для:

- confirmations;
- dropdowns;
- alerts;
- crop flow;
- tiny dialogs.

---

# Query Params Strategy

Использовать query params только для:

- filters;
- search;
- sorting;
- pagination.

Пример:

```txt
/admin/users?page=1&sort=createdAt.desc&search=john
```

---

# Provider Strategy

Providers подключаем максимально deep.

## Не делать giant AppProviders

Плохой пример:

```tsx
<AppProviders>
```

---

## Правильный подход

Providers подключаем только там, где они реально нужны.

Например:

```txt
[locale]/layout.tsx
```

- i18n provider.

```txt
(protected)/layout.tsx
```

- auth/session boundary.

```txt
(main)/layout.tsx
```

- modal-related providers if needed.

---

# Что Не Делаем Сейчас

Не реализовывать:

- realtime;
- websocket layer;
- optimistic updates;
- generic modal managers;
- giant abstractions;
- generic table engines;
- global query param parsers;
- business logic inside app/;
- API orchestration in layouts.

---

# Главный Architectural Risk

Самый неприятный будущий сценарий:

```txt
duplicated app shells
```

Layouts заводим рано, чтобы потом не разгребать:

- duplicated sidebar;
- duplicated header;
- duplicated auth checks;
- duplicated modal containers.

---

# Главный Принцип Проекта

```txt
Route/layout boundaries first.
UI complexity second.
Business logic later.
```

Это главный architectural guideline проекта.
