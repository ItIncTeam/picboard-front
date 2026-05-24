# Routing Plan

Этот документ является source of truth для текущего App Router skeleton.

Документ сопоставляет текущую структуру `src/app` с тремя основными зонами Figma:

- Auth: `301:4851` — `WebApp / UI / Auth`
- Main Web App: `1:12` — `WebApp / UI`
- SuperAdmin: `376:8092` — `WebApp / UI / SuperAdmin`

---

# Текущая структура App Router

```text
src/app/
  page.tsx                                      -> redirect на /ru/main
  layout.tsx                                   -> root HTML/body, metadata, global styles
  not-found.tsx
  [locale]/
    layout.tsx                                 -> locale shell
    (shared)/
      main/page.tsx                            -> /:locale/main
    (public)/
      auth/
        sign-in/page.tsx                       -> /:locale/auth/sign-in
        sign-up/page.tsx                       -> /:locale/auth/sign-up
        forgot-password/page.tsx               -> /:locale/auth/forgot-password
        privacy-policy/page.tsx                -> /:locale/auth/privacy-policy
        terms/page.tsx                         -> /:locale/auth/terms
        confirm/
          registration/page.tsx                -> /:locale/auth/confirm/registration
          password-recovery/page.tsx           -> /:locale/auth/confirm/password-recovery
    (protected)/
      (main)/
        feed/page.tsx                          -> /:locale/feed
        favorites/page.tsx                     -> /:locale/favorites
        messenger/page.tsx                     -> /:locale/messenger
        messenger/[dialogId]/page.tsx          -> /:locale/messenger/:dialogId
        posts/create/page.tsx                  -> /:locale/posts/create
        posts/[postId]/page.tsx                -> /:locale/posts/:postId
        profile/[userId]/page.tsx              -> /:locale/profile/:userId
        profile/followers/page.tsx             -> /:locale/profile/followers
        profile/subscriptions/page.tsx         -> /:locale/profile/subscriptions
        search/page.tsx                        -> /:locale/search
        settings/account/page.tsx              -> /:locale/settings/account
        settings/devices/page.tsx              -> /:locale/settings/devices
        settings/notifications/page.tsx        -> /:locale/settings/notifications
        settings/profile/page.tsx              -> /:locale/settings/profile
        statistics/page.tsx                    -> /:locale/statistics
      admin/
        users/page.tsx                         -> /:locale/admin/users
        statistics/page.tsx                    -> /:locale/admin/statistics
        payments/page.tsx                      -> /:locale/admin/payments
        posts/page.tsx                         -> /:locale/admin/posts
        moderation/page.tsx                    -> /:locale/admin/moderation
```

Route groups в скобках используются только для организации структуры и не попадают в URL:

- `(public)`
- `(protected)`
- `(main)`
- `(shared)`

Dynamic segments используются только для реальной идентификации сущностей:

- `[userId]`
- `[postId]`
- `[dialogId]`

---

# Соответствие Figma

| Figma node | Область      | Покрытие routes                                                                                                     |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `301:4851` | Auth         | sign in, sign up, forgot password, privacy policy, terms, registration confirmation, password recovery confirmation |
| `1:12`     | Main Web App | main, feed, profile, followers, subscriptions, messenger, dialog, search, favorites, statistics, posts, settings    |
| `376:8092` | SuperAdmin   | users, statistics, payments, posts, moderation                                                                      |

---

# Подтвержденные routes

Эти routes соответствуют отдельным page-level экранам из текущего Figma-макета или уже являются стабильными зонами продукта.

```text
/:locale/main

/:locale/auth/sign-in
/:locale/auth/sign-up
/:locale/auth/forgot-password
/:locale/auth/privacy-policy
/:locale/auth/terms
/:locale/auth/confirm/registration
/:locale/auth/confirm/password-recovery

/:locale/feed
/:locale/favorites

/:locale/messenger
/:locale/messenger/:dialogId

/:locale/posts/create
/:locale/posts/:postId

/:locale/profile/:userId
/:locale/profile/followers
/:locale/profile/subscriptions

/:locale/search

/:locale/settings/account
/:locale/settings/devices
/:locale/settings/notifications
/:locale/settings/profile

/:locale/statistics

/:locale/admin/users
/:locale/admin/statistics
/:locale/admin/payments
/:locale/admin/posts
```

---

# Routes, требующие подтверждения

Эти routes существуют или предлагаются, но требуют подтверждения product/team решений перед полноценной реализацией UI и auth guards.

| Route                        | Статус             | Причина                                                                                                                            |
| ---------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/:locale/profile/:userId`   | needs confirmation | В Figma есть profile как для authorized, так и unauthorized user. Нужно подтвердить: route public, protected или shared rendering. |
| `/:locale/profile/me`        | needs confirmation | Route пока не создан. Может понадобиться для "My profile".                                                                         |
| `/:locale/main`              | needs confirmation | Root сейчас redirect на `/ru/main`. Нужно подтвердить: старт после логина — `/main` или `/feed`.                                   |
| `/:locale/settings/devices`  | needs confirmation | Добавлен, потому что в Figma есть `Profile Settings / Devices`. Нужно подтвердить MVP scope.                                       |
| `/:locale/admin/moderation`  | needs confirmation | Route существует, но основной SuperAdmin flow в Figma сфокусирован на users/statistics/payments/posts.                             |
| Deep links для admin modals  | needs confirmation | Пока не создавались. Нужно подтвердить необходимость URL для delete/unban/more-info actions.                                       |
| `/:locale/*` locale handling | needs confirmation | Сейчас `[locale]` принимает любое значение. Нужно подтвердить supported locales и fallback behavior.                               |

---

# UI-состояния без отдельных routes

Для этих состояний НЕ нужно создавать отдельные routes, пока команда явно не запросит deep links.

- validation errors
- expired link state
- delete confirmation
- unban confirmation
- more info modal
- dropdown menu states
- empty visual states
- loading visual states
- error visual states
- form field focus/hover/disabled/invalid states
- table sorting/filtering states
- pagination selected-page state

---

# Вопросы команде

1. `/:locale/profile/:userId` — public, protected или shared route?
2. Нужен ли `/:locale/profile/me`?
3. После логина пользователь должен попадать на `/main` или `/feed`?
4. Входит ли `/:locale/settings/devices` в MVP?
5. Нужен ли `/:locale/admin/moderation` в MVP?
6. Нужны ли deep links для admin actions:
   - delete
   - unban
   - more info

7. Какие locales поддерживаются на старте?
8. Что делать при неизвестной locale:
   - redirect на default locale
   - not-found
   - locale selector

9. Auth confirmation pages должны быть:
   - отдельными success/error pages
   - или одной state-driven страницей?

---

# Текущий статус реализации

- App Router skeleton реализован и покрывает три основные Figma-зоны:
  - Auth
  - Main Web App
  - SuperAdmin

- `src/app` остается тонким:
  - routes
  - layouts
  - redirects
  - metadata
  - placeholder pages

- Placeholder views вынесены в `src/views/*`.

- В рамках routing-задачи intentionally out of scope:
  - business logic
  - API calls
  - stores
  - auth guards
  - полноценная реализация экранов

- Route-level layouts пока pending:
  - `(public)/auth/layout.tsx`
  - `(protected)/(main)/layout.tsx`
  - `(protected)/admin/layout.tsx`

- Полноценная реализация экранов должна выполняться отдельно, route-by-route, в scoped PR.

```

```
