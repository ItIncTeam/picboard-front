# Routing Plan

Документ фиксирует текущий routing skeleton для Next.js App Router и сопоставление routes с Figma-макетами.

Основа уже собрана и покрывает основные зоны приложения:

- Auth
- Main Web App
- SuperAdmin

Документ нужен скорее как инженерная карта роутинга и список спорных мест перед полноценной реализацией экранов.

---

# Текущая структура App Router

```text
src/app/
  page.tsx                                      -> redirect на /ru/main
  layout.tsx
  not-found.tsx

  [locale]/
    layout.tsx

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

Route groups используются только для организации структуры и не попадают в URL:

- `(public)`
- `(protected)`
- `(main)`
- `(shared)`

Dynamic segments:

- `[userId]`
- `[postId]`
- `[dialogId]`

---

# Соответствие Figma

| Figma node | Область      | Покрытие                                                                |
| ---------- | ------------ | ----------------------------------------------------------------------- |
| `301:4851` | Auth         | sign in, sign up, forgot password, terms, privacy policy, confirm flows |
| `1:12`     | Main Web App | feed, profile, messenger, search, settings, statistics, posts           |
| `376:8092` | SuperAdmin   | users, statistics, payments, posts, moderation                          |

---

# Что уже выглядит нормально

Сейчас routing skeleton выглядит достаточно логично и близко к ожидаемой структуре приложения.

Вероятнее всего останутся:

- `/feed`
- `/messenger`
- `/search`
- `/posts/[postId]`
- `/admin/users`
- `/admin/payments`
- `/settings/*`

Также нормально выглядит разделение на:

- public routes
- protected routes
- admin area

Идея держать `src/app` тонким тоже выглядит правильной:

- routes
- layouts
- redirects
- metadata
- placeholder pages

Без business logic внутри App Router.

---

# Что может потребовать обсуждения

## Profile routing

Сейчас:

```text
/:locale/profile/:userId
/:locale/profile/followers
/:locale/profile/subscriptions
```

Тут есть потенциальная неоднозначность.

Возможно позже будет лучше:

```text
/:locale/profile/:userId/followers
/:locale/profile/:userId/subscriptions
```

или:

```text
/:locale/profile/me
```

Пока текущий вариант оставлен как временный skeleton.

---

## Стартовая страница после логина

Сейчас root redirect ведет на:

```text
/ru/main
```

Но пока не до конца понятно:

- нужен ли вообще `/main`;
- или основным entry point должен быть `/feed`.

---

## Settings / Devices

Route добавлен, потому что в Figma есть отдельный экран Devices.

Скорее всего route нужен, но стоит подтвердить:

- входит ли он в MVP;
- нужен ли отдельный экран или это будет subsection.

---

## Admin / Moderation

Route существует:

```text
/:locale/admin/moderation
```

Но в макете основная админская зона больше сфокусирована на:

- users
- payments
- statistics
- posts

Стоит отдельно уточнить необходимость moderation в MVP.

---

## Locale handling

Сейчас `[locale]` принимает любое значение.

Нужно договориться:

- какие locale поддерживаются;
- что делать с неизвестной locale;
- нужен ли redirect на default locale.

---

# Что специально НЕ вынесено в routes

Пока это выглядит как UI state, а не отдельные страницы:

- validation errors
- expired link state
- delete confirmation
- unban confirmation
- more info modal
- dropdown states
- sorting/filter states
- loading/error states
- pagination states

Пока нет необходимости делать для них отдельные URLs.

---

# Что стоит уточнить

## Profile

- profile public или protected?
- нужен ли `/profile/me`?

## Auth flow

- после логина вести на `/main` или `/feed`?
- confirm pages отдельные или state-driven?

## Admin

- нужен ли moderation section в MVP?
- нужны ли deep links для modals/actions?

## Localization

- какие locale поддерживаем?
- что делаем с неизвестной locale?

---

# Текущий статус

Сейчас routing skeleton:

- собран;
- проходит lint/typecheck/build;
- покрывает основные Figma-зоны;
- готов как база под дальнейшую реализацию экранов.

Следующий логичный этап:

- route-level layouts;
- auth guards;
- постепенная реализация screen-by-screen.
