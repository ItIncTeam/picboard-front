# Project Start Guide

Короткий guide, чтобы быстро въехать в Picboard frontend и не сломать архитектуру в первый день.

Документация пишется на русском языке. Технические термины и код остаются на английском.

Подробная App Router architecture лежит в [App Router Roadmap](./app-router-roadmap.md). Если есть
сомнения по routing или layouts, сначала смотри туда.

## Что Это За Проект

Picboard — социальное web-приложение на Next.js App Router и TypeScript.

Внутри есть:

- public/auth pages;
- protected user app pages;
- отдельные admin pages;
- много будущих modal flows.
- frontend-only localization без locale segment в URL.

## Где Мы Сейчас

Мы находимся на:

```txt
ЭТАП 2 — Auth Foundation
```

Routing Foundation уже зафиксировал route и layout boundaries. Сейчас главное — не менять routing
architecture без причины и готовить auth, не добавляя преждевременные providers, middleware или
business logic.

## Главная Мысль

`app/` должен оставаться thin.

`app/` нужен для routing infrastructure. Всё, что похоже на настоящую сборку экрана, уходит в
`views`.

Локализация работает на frontend через i18n library и не влияет на routing structure.

App Router не содержит `[locale]`, `/ru/*`, `/en/*` и locale validation.

## Слои

```txt
app       -> routes, layouts, redirects, metadata, modal slots
views     -> page composition
widgets   -> large UI blocks
features  -> user actions
entities  -> business entities
shared    -> reusable UI, helpers, constants, infrastructure
```

## Что Нельзя Класть В app/

В `app/` не кладём:

- business logic;
- form state;
- API calls;
- stores;
- reusable UI;
- complex page composition.

## Как Выглядят Pages

`page.tsx` должен быть маленьким routing adapter.

```tsx
import { FeedPage } from '@/views/feed-page'

export default function Page() {
  return <FeedPage />
}
```

С route params:

```tsx
import { ProfilePage } from '@/views/profile-page'

export default async function Page({ params }: PageProps<'/profile/[userId]'>) {
  const { userId } = await params

  return <ProfilePage userId={userId} />
}
```

## Зачем Нужны Layouts

`layout.tsx` задаёт app shells и boundaries, чтобы мы не копировали одни и те же обёртки по всем
pages.

Примеры:

- public/auth shell;
- protected app boundary;
- main user app shell;
- settings section shell;
- admin shell.

## Почему Layouts Уже Есть Как Placeholders

Некоторые layouts сейчас просто render `children`.

Это нормально. Они заранее занимают правильное место в routing tree. Потом туда спокойно добавятся
headers, sidebars, auth checks и modal containers без большого refactor.

## В Каком Порядке Делаем

1. Завершить routing foundation.
2. Собрать auth foundation.
3. Собрать main app shell.
4. Реализовать core pages.
5. Добавить route-based modals.
6. Реализовать messenger.
7. Реализовать admin panel.

## Что Дальше

После Routing Foundation следующий этап:

```txt
ЭТАП 2 — Auth Foundation
```

Следующим берём auth, потому что от него зависят protected boundaries, redirects и session behavior.

## Базовые Правила

- Перед routing changes читай [App Router Roadmap](./app-router-roadmap.md).
- Держи `app/` thin.
- По умолчанию используй Server Components.
- Не добавляй providers, пока они реально не нужны.
- Не добавляй i18n provider или translation loading до отдельной задачи.
- Не дублируй app shells внутри pages.
- Используй query params только для filters, search, sorting и pagination.
- Используй route-based modals только для shareable entity content.
- Маленькие dialogs, dropdowns и confirmations держи как local UI state.
