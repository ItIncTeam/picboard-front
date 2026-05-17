# Git Flow

## Branches

Одна задача — одна ветка.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/SCRUM-17-login-form
```

Для технических задач:

```bash
git checkout -b chore/SCRUM-17-setup-tooling
```

## Commits

Формат:

```text
<JIRA-ID> <type>: <description>
```

Пример:

```text
SCRUM-17 feat: add login form
```

Разрешенные типы:

- `init`
- `feat`
- `fix`
- `refactor`
- `test`
- `docs`
- `chore`
- `build`
- `ci`

## Rebase

Обновляйте ветку от `dev` регулярно:

```bash
git fetch origin
git rebase origin/dev
```

Если есть конфликт:

```bash
git add .
git rebase --continue
```

Отмена rebase:

```bash
git rebase --abort
```

## Before Push

```bash
pnpm check
```

Первый push:

```bash
git push -u origin feature/SCRUM-17-login-form
```

После rebase:

```bash
git push --force-with-lease
```

Не используйте:

```bash
git push --force
```

## Rules

- Не пушьте напрямую в `main` или `dev`.
- Не смешивайте feature, refactor и formatting в одном PR без необходимости.
- Не держите большие PR.
- Не меняйте `shared/ui` без согласования, если изменение влияет на другие команды.
