# Architecture

Picboard использует простую структуру, близкую к FSD.

Цель: быстро понять, куда класть код, и не плодить дубликаты.

## Слои

```txt
app       -> маршруты и layouts
views     -> сборка страницы
widgets   -> крупные визуальные блоки
features  -> действия пользователя
entities  -> бизнес-сущности
shared    -> общая инфраструктура
```

Подробные правила владения слоями: [Границы слоев](./layer-ownership.md).

Актуальная карта роутинга: [App Router](./app-router-roadmap.md).

## app/

Здесь только Next.js infrastructure:

- `layout.tsx`;
- `page.tsx`;
- route groups;
- modal slots;
- metadata;
- `not-found.tsx`.

`page.tsx` импортирует view и возвращает его.

```tsx
import { FeedPage } from '@/views/feed-page'

export default function Page() {
  return <FeedPage />
}
```

В `app/` не пишем бизнес-логику, формы, API calls, stores и reusable UI.

## views/

View собирает конкретную страницу.

Примеры:

- `views/sign-in-page` подключает `PublicAuthShell`;
- `views/feed-page` позже соберет feed widgets;
- `views/profile-page` позже соберет profile widgets.

## widgets/

Widget — крупная композиционная граница.

Примеры:

- `public-header`;
- `public-auth-shell`;
- будущий `app-header`;
- будущий `sidebar`.

Widget может собирать shared primitives и features. Widget не должен читать токены, ходить в API или
решать права доступа.

## features/

Feature — действие пользователя.

Примеры:

- sign in form;
- sign up form;
- create post;
- follow user;
- send message.

Будущие auth forms должны жить в `features/auth` или в более точных auth feature folders.

## entities/

Entity — бизнес-сущность.

Примеры:

- user;
- post;
- message;
- payment.

Entity описывает данные и базовые правила сущности. Она не зависит от features.

## shared/ui

Только примитивы интерфейса:

- Button;
- Input;
- Select;
- Checkbox;
- Typography.

Не кладем сюда headers, shells, page layouts и auth-specific blocks.

## Локализация

URL не содержит язык.

Не добавляем `/ru`, `/en` и `[locale]` в App Router. Локализация будет работать на клиенте и не
меняет структуру маршрутов.
