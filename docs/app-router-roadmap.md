# App Router: текущая карта

Этот документ описывает только текущую основу роутинга. Не добавляйте сюда подробный дизайн будущих
фич.

Главное правило:

```txt
Сначала route/layout boundaries.
Потом UI.
Потом бизнес-логика.
```

## Что уже есть

```txt
src/app/
  layout.tsx
  not-found.tsx

  (public)/
    layout.tsx
    page.tsx
    auth/
      sign-in/page.tsx
      sign-up/page.tsx
      forgot-password/page.tsx
      create-new-password/page.tsx
      confirm/
        registration/page.tsx
        password-recovery/page.tsx

  (protected)/
    layout.tsx
    (main)/
      layout.tsx
      @modal/default.tsx
      @modal/[...catchAll]/page.tsx
      main/page.tsx
      feed/page.tsx
      messenger/page.tsx
      messenger/[dialogId]/page.tsx
      search/page.tsx
      favorites/page.tsx
      statistics/page.tsx
      profile/[userId]/page.tsx
      profile/[userId]/followers/page.tsx
      profile/[userId]/subscriptions/page.tsx
      settings/layout.tsx
      settings/profile/page.tsx
      settings/account/page.tsx
      settings/devices/page.tsx
      settings/notifications/page.tsx
      posts/create/page.tsx
      posts/[postId]/page.tsx
    admin/
      layout.tsx
      users/page.tsx
      payments/page.tsx
      statistics/page.tsx
      posts/page.tsx
```

Route groups `(public)` и `(protected)` не попадают в URL. Они нужны только для разделения layouts.

## Ответственность layouts

`src/app/layout.tsx` содержит только `html`, `body`, metadata и глобальные стили.

`src/app/(public)/layout.tsx` содержит публичный визуальный shell: `PublicHeader` и общий `<main>`.
Здесь нет auth-логики.

`src/app/(protected)/layout.tsx` сейчас только пропускает `children`. Позже здесь появится session
boundary. Пока не добавляем redirects, middleware и чтение токенов.

`src/app/(protected)/(main)/layout.tsx` держит основной protected segment и slot `@modal`.

`settings/layout.tsx` и `admin/layout.tsx` занимают места под будущие section shells. Пока они
легкие.

## Файлы page.tsx

`page.tsx` должен быть тонким адаптером:

```tsx
import { SignInPage } from '@/views/sign-in-page'

export default function Page() {
  return <SignInPage />
}
```

Не пишите в `page.tsx` формы, запросы, состояние и сложную верстку.

## Публичные auth routes

Текущие auth routes:

```txt
/auth/sign-in
/auth/sign-up
/auth/forgot-password
/auth/create-new-password
/auth/confirm/registration
/auth/confirm/password-recovery
```

Terms of Service и Privacy Policy показываются на `/auth/sign-up` через `widgets/doc-modal`
(`DocModal`); текст — в `shared/content/legal` (`termsParagraphs`, `privacyParagraphs`, `LegalDocumentBody`).

Auth views используют `PublicAuthShell`. Реальные формы позже должны прийти из `features/auth`.

Подробная карта auth routes, views, features и GraphQL operations находится в
[Auth Routes](./auth/auth-routes.md).

## Widgets

Текущие публичные widgets:

```txt
widgets/public-header
widgets/public-auth-shell
```

`PublicHeader` — верхняя визуальная панель. Пока без dropdown и логики языка.

`PublicAuthShell` — общая рамка auth pages. Без page-specific условий.

## Modals

Route-based modals живут в `app/(protected)/(main)/@modal`. Они нужны для контента, который можно
открыть отдельным URL.

Local UI modals живут рядом с feature или widget. Это confirmations, dropdowns и маленькие dialogs.

Пока не добавляем общий modal manager.

## Providers

Не создаем общий provider на весь проект без причины.

Provider добавляется только там, где он реально нужен:

- глобальный provider — в root layout;
- auth/session provider — в protected boundary;
- локальный provider — рядом с feature или widget.

Если provider пока не нужен, его не добавляем.

## Что не делаем сейчас

- middleware;
- auth redirects;
- token handling;
- API calls в layouts;
- формы и validation в `app/`;
- Zustand stores без готового сценария;
- временный UI kit;
- dropdown behavior без задачи.
