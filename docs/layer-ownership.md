# Границы слоев

Этот документ отвечает на вопрос: куда класть новый код.

## app/

Кладем:

- route groups;
- `layout.tsx`;
- `page.tsx`;
- `not-found.tsx`;
- modal slots;
- metadata.

Не кладем:

- формы;
- API calls;
- Zustand stores;
- бизнес-логику;
- reusable UI.

Пример route adapter:

```tsx
import { SignInPage } from '@/views/sign-in-page'

export default function Page() {
  return <SignInPage />
}
```

## views/

Кладем сборку страницы.

Пример auth page:

```tsx
import { PublicAuthShell } from '@/widgets/public-auth-shell'

export function SignInPage() {
  return <PublicAuthShell title="Sign In" />
}
```

Когда появится форма, view подключит feature:

```tsx
<PublicAuthShell title="Sign In">
  <SignInForm />
</PublicAuthShell>
```

## widgets/

Кладем крупные композиционные блоки:

- headers;
- sidebars;
- shells;
- feeds;
- profile blocks.

Примеры сейчас:

- `widgets/public-header`;
- `widgets/public-auth-shell`.

Widget не должен знать про session, token storage и API.

Header живет в `widgets/`, если это часть shell.

Shell живет в `widgets/`, если он переиспользуется между несколькими views.

## features/

Кладем действия пользователя:

- sign in;
- sign up;
- forgot password;
- create post;
- follow user.

Будущие auth forms должны жить в `features/auth`.

## entities/

Кладем бизнес-сущности:

- user;
- post;
- message;
- payment.

Entity описывает данные и базовые правила сущности.

## shared/ui

Кладем только примитивы:

- Button;
- Input;
- Select;
- Checkbox;
- Typography.

Не кладем:

- `PublicAuthShell`;
- `PublicHeader`;
- page layouts;
- auth-specific UI.

## Layout components

Если layout нужен нескольким страницам, он обычно живет в `widgets/`.

Если layout нужен только конкретному route segment, он может остаться в `app/.../layout.tsx`.

## Placeholders

Заглушка нужна только для маршрута или integration point.

Можно использовать `RoutePlaceholder`, если экран еще не готов.

Не создаем временные кнопки, инпуты, dropdown behavior, stores и API mocks.

Когда реальный компонент готов, заменяем заглушку в одном view.

## Modals

Route-based modal живет в `app/.../@modal`, если у него должен быть URL.

Local modal живет рядом с feature или widget, если это обычный UI dialog.

Пример route-based места:

```txt
src/app/(protected)/(main)/@modal
```

Пример local места:

```txt
features/create-post/ui
widgets/profile-header
```

## Параллельная работа

Разработчик маршрута создает `page.tsx` и view.

Разработчик layout создает widget shell.

Разработчик feature создает компонент в `features/`.

Перед созданием нового компонента проверьте `views/`, `widgets/`, `features/` и `shared/ui`.
