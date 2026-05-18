# Tooling

Основной источник правил: [Picboard Frontend Style Guide](./style_guide_full.md). Этот файл
фиксирует команды и ответственность инструментов.

## Responsibilities

- Prettier отвечает только за formatting.
- ESLint отвечает за TypeScript, React и code quality.
- Stylelint отвечает за CSS/SCSS quality.
- TypeScript отвечает за type safety.

## Commands

```bash
pnpm dev
pnpm lint
pnpm lint:styles
pnpm format:check
pnpm typecheck
pnpm build
pnpm check
```

## Main Check

Перед PR используйте одну команду:

```bash
pnpm check
```

Она последовательно запускает:

1. ESLint.
2. Stylelint.
3. Prettier check.
4. TypeScript check.
5. Next.js production build.

## Rules

- Не добавляйте legacy `.eslintrc`.
- Не добавляйте форматирующие правила в ESLint, если за них отвечает Prettier.
- Не добавляйте новые зависимости для tooling без необходимости.
- Не усложняйте config: junior/middle разработчик должен быстро понять, что проверяется.
- При изменении Next.js config или build behavior проверьте локальные docs:
  `node_modules/next/dist/docs/`.

## Known Local Issue

На Windows локально возможен `EPERM` при перезаписи `.next` во время `next build`. Это файловая
блокировка окружения, а не ошибка lint/typecheck setup.
