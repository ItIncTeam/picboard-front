# Picboard Frontend Style Guide

Этот файл — основной источник правил для Picboard frontend. Если другие документы расходятся с ним,
сначала обновите этот файл, затем синхронизируйте остальные.

Внешний источник для code style: <https://code-style.it-incubator.io/react>

Документы написаны для разработчиков и ревьюеров, но сформулированы так, чтобы AI-агент мог
использовать их как рабочие инструкции.

## Документы

- [Project Brief](./project-brief.md) — цели проекта, scope, ограничения, lifecycle и milestones.
- [Code Style](./code-style.md) — naming, TypeScript, React, imports/exports, комментарии.
- [Architecture](./architecture.md) — FSD-подход, структура модулей, shared-код.
- [Tooling](./tooling.md) — ESLint, Prettier, Stylelint, TypeScript и команды проверки.
- [Git Flow](./git-flow.md) — ветки, commits, rebase, push.
- [Pull Request](./pull-request.md) — требования перед PR и checklist.
- [Рабочие инструкции](./work-instructions.md) — порядок работы для команды и AI-агента.
- [Project Start Guide](./project-start-guide.md) — короткий onboarding для новых участников.
- [Assets](./assets.md) — правила импорта SVG, иконок и растровых изображений.
- [App Router](./app-router-roadmap.md) — текущая структура маршрутов, layouts, modals и provider rules.
- [Границы слоев](./layer-ownership.md) — практические правила владения `app`, `views`, `widgets`, `features` и временными заглушками.
- [Auth Infrastructure](./auth/auth-infrastructure-plan.md) — FSD-границы, PR roadmap и Apollo/auth integration points.
- [Auth Session Architecture](./auth/auth-session-architecture.md) — access token, refresh token и session flow.
- [Auth Backend Contract](./auth/auth-backend-contract.md) — GraphQL queries, mutations, inputs и payloads.
- [Auth Routes](./auth/auth-routes.md) — `/auth` маршруты, views, features и GraphQL operations.

## Базовые принципы

- Код должен быть читаемым, предсказуемым и однообразным.
- Простое решение предпочтительнее сложного.
- Prettier отвечает за formatting.
- ESLint отвечает за code quality.
- Stylelint отвечает за CSS/SCSS quality.
- TypeScript должен использоваться строго, без `any`, если есть безопасная альтернатива.
- Архитектура должна оставаться простой и близкой к FSD.
- Одна задача должна давать один понятный PR без случайных refactor/formatting изменений.
- Новые зависимости добавляются только при явной пользе для задачи.

## Рабочий порядок

1. Перед изменениями прочитайте существующий код, конфиги и релевантные документы из этой папки.
2. Для задач с продуктовым влиянием проверьте [Project Brief](./project-brief.md): scope,
   out-of-scope, допущения и ограничения.
3. Для Next.js API, роутинга, metadata, server/client components и framework special files сначала
   проверьте локальные docs: `node_modules/next/dist/docs/`.
4. Делайте минимальное изменение в стиле текущего модуля.
5. После изменения запустите релевантную проверку. Перед PR по умолчанию нужен `pnpm check`.
6. В PR или summary явно укажите, что изменилось, что проверено и какие риски остались.

## Быстрая проверка

Перед PR запустите:

```bash
pnpm check
```
