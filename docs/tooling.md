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
pnpm check:verify
pnpm hooks:install
pnpm check:pre-commit
pnpm check:pre-push
```

## Main Check

Перед PR используйте одну команду:

```bash
pnpm check
```

Она последовательно запускает:

1. Prettier write для форматирования проекта.
2. ESLint `--fix` для автоисправления TypeScript/React-кода.
3. Stylelint `--fix` для автоисправления CSS/SCSS.
4. ESLint check для оставшихся ошибок.
5. Stylelint check для оставшихся CSS/SCSS-ошибок.
6. Prettier check.
7. TypeScript check.
8. Next.js production build.

`pnpm check` может менять файлы в рабочем дереве. После запуска проверьте diff перед commit.

Для CI и pre-push используется read-only вариант:

```bash
pnpm check:verify
```

Он запускает только проверки без автоисправлений, чтобы push не уходил с незакоммиченными
локальными изменениями.

## Git Hooks

Hooks находятся в `.husky/`. После `pnpm install` команда `prepare` настраивает Git:

```bash
git config core.hooksPath .husky
```

Если hooks не подключились автоматически, запустите:

```bash
pnpm hooks:install
```

`pre-commit` — легкая проверка перед коммитом. Она запускает автофиксеры только для staged-файлов:
Prettier, ESLint `--fix` и Stylelint `--fix`. Исправленные файлы автоматически добавляются обратно
в commit.

Hook не проверяет весь проект, чтобы не блокировать маленькие рабочие коммиты старыми ошибками.

`pre-push` — строгая проверка перед отправкой ветки на сервер. Она запускает:

1. Prettier write для форматирования проекта.
2. Diff check: если Prettier изменил файлы, push останавливается, чтобы форматирование попало в
   commit.
3. ESLint.
4. Stylelint.
5. Prettier check.
6. TypeScript check.
7. Next.js production build.

Если hook падает, в выводе есть команда, причина остановки и короткая подсказка, что исправить.

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
