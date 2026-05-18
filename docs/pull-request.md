# Pull Request

Основной источник правил: [Picboard Frontend Style Guide](./style_guide_full.md). Этот файл
помогает проверить готовность изменений к review.

## Title

Формат:

```text
SCRUM-17 feat: add login form
```

## Before PR

Перед открытием PR запустите:

```bash
pnpm check
```

## Description

В описании PR укажите:

- что изменено;
- почему это изменение нужно;
- deploy link, если он есть;
- screenshots или video для UI-изменений;
- важные implementation notes;
- риски и edge cases, если они есть.

## Checklist

- [ ] PR относится к одной задаче.
- [ ] Нет случайных formatting-only изменений.
- [ ] Нет закомментированного кода.
- [ ] Нет новых зависимостей без причины.
- [ ] `pnpm check` проходит локально.
- [ ] UI-изменения приложены скриншотами.
- [ ] Для изменений Next.js API/conventions проверены локальные docs `node_modules/next/dist/docs/`.
- [ ] Нет конфликтов с `dev`.

## Merge

- Нужен минимум один approve.
- CI должен быть green.
- Merge strategy: squash and merge.
