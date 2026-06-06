# Picboard Frontend

Frontend для Picboard — социальной web-платформы для публикации мультимедийного контента,
профилей, ленты, подписок, комментариев, сообщений, уведомлений и платных подписок.

Проект разрабатывается как адаптивное Next.js приложение. Продуктовые границы и рабочие правила
зафиксированы в `docs/`.

## Стек

- Next.js 16
- React 19
- TypeScript
- GraphQL / Apollo Client
- Redux Toolkit
- React Hook Form
- Zod
- Sass / Tailwind CSS
- ESLint, Prettier, Stylelint

## Быстрый старт

Установите зависимости:

```bash
pnpm install
```

Настройте `.env.local` по [Project Start Guide](./docs/project-start-guide.md). Для auth и
forgot-password локально нужны `NEXT_PUBLIC_GRAPHQL_ENDPOINT` и
`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.

Запустите dev server:

```bash
pnpm dev
```

Откройте `http://localhost:3000`.

## Команды

```bash
pnpm dev
pnpm lint
pnpm lint:styles
pnpm format:check
pnpm typecheck
pnpm build
pnpm check
pnpm hooks:install
pnpm check:pre-commit
pnpm check:pre-push
```

Перед PR по умолчанию запускайте:

```bash
pnpm check
```

## Git hooks

Hooks лежат в `.husky/` и подключаются после установки зависимостей через `prepare`. Если hooks не
срабатывают локально, запустите:

```bash
pnpm hooks:install
```

Что проверяется:

- `pre-commit` — легкая проверка: автофикс Prettier, ESLint и Stylelint только для staged-файлов.
- `pre-push` — строгая проверка перед отправкой на сервер: сначала Prettier форматирует проект и
  останавливает push, если появились изменения, затем запускаются ESLint, Stylelint, Prettier
  check, TypeScript и production build.

## Документация

Главная точка входа для правил команды:

- `docs/style_guide_full.md`

Дополнительные документы:

- `docs/project-brief.md` — цели проекта, scope, out-of-scope, ограничения и milestones.
- `docs/project-start-guide.md` — локальная настройка, onboarding и базовые FSD-ориентиры.
- `docs/work-instructions.md` — рабочий порядок для команды и AI-агента.
- `docs/code-style.md` — naming, TypeScript, React, imports/exports, комментарии.
- `docs/architecture.md` — архитектурный подход и правила слоев.
- `docs/tooling.md` — ответственность инструментов и команды проверки.
- `docs/git-flow.md` — ветки, commits, rebase и push.
- `docs/pull-request.md` — требования к PR.

Для AI-агентов короткая входная инструкция находится в `AGENTS.md`.

## Next.js

В проекте используется версия Next.js с возможными breaking changes относительно привычных API и
conventions. Перед изменением routing, layouts, metadata, server/client components, config или
framework special files проверяйте локальные документы:

```text
node_modules/next/dist/docs/
```

## Рабочие правила

- Держите изменения маленькими и связанными с одной задачей.
- Для продуктовых задач сверяйтесь с `docs/project-brief.md`.
- Не добавляйте зависимости без необходимости.
- Не смешивайте feature, refactor и formatting в одном PR без причины.
- Используйте strict TypeScript, named exports и не используйте `React.FC`.
- В summary или PR указывайте, что изменилось, что проверено и какие риски остались.
