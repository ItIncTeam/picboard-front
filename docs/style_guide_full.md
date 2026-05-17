# Picboard Frontend Style Guide

Источник истины для code style: <https://code-style.it-incubator.io/react>

Этот раздел описывает правила разработки для Picboard frontend. Документы предназначены для
разработчиков, ревьюеров и AI/Codex-агентов.

## Документы

- [Code Style](./code-style.md) — naming, TypeScript, React, imports/exports, комментарии.
- [Architecture](./architecture.md) — FSD-подход, структура модулей, shared-код.
- [Tooling](./tooling.md) — ESLint, Prettier, Stylelint, TypeScript и команды проверки.
- [Git Flow](./git-flow.md) — ветки, commits, rebase, push.
- [Pull Request](./pull-request.md) — требования перед PR и checklist.
- [Codex Instructions](./codex-instructions.md) — рабочие правила для AI/Codex-агента.

## Базовые принципы

- Код должен быть читаемым, предсказуемым и однообразным.
- Простое решение предпочтительнее сложного.
- Prettier отвечает за formatting.
- ESLint отвечает за code quality.
- Stylelint отвечает за CSS/SCSS quality.
- TypeScript должен использоваться строго, без `any`, если есть безопасная альтернатива.
- Архитектура должна оставаться простой и близкой к FSD.

## Быстрая проверка

Перед PR запустите:

```bash
pnpm check
```
