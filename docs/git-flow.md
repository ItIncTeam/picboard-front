# Git Flow

Основной источник правил: [Picboard Frontend Style Guide](./style_guide_full.md). Этот файл
описывает полный рабочий процесс с ветками, коммитами, актуализацией и мержем.

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

---

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

---

## Rebase (регулярная актуализация ветки)

Обновляйте ветку от `dev` регулярно в процессе разработки, а не только перед мержем.
Это минимизирует конфликты и упрощает финальную сборку.

```bash
git fetch origin
git rebase origin/dev
```

Если есть конфликт — разрешить его в IDE, затем:

```bash
git add .
git rebase --continue
```

Отмена rebase в случае проблем:

```bash
git rebase --abort
```

**Важно:** после любого успешного rebase история вашей ветки переписана,
поэтому следующий push должен быть принудительным, но безопасным:

```bash
git push --force-with-lease
```

---

## Before Push (подготовка к созданию Pull Request)

Перед тем как отдать код на ревью, выполните финальную актуализацию и проверки.

### 1. Финальный rebase на актуальный `dev`

```bash
git fetch origin
git rebase origin/dev
# если были конфликты — разрешить и завершить rebase
```

### 2. Запуск проверок

```bash
pnpm check
```

### 3. Push ветки

Первый push ветки:

```bash
git push -u origin feature/SCRUM-17-login-form
```

После rebase (если ветка уже пушилась ранее):

```bash
git push --force-with-lease
```

**Запрещено использовать:**

```bash
git push --force
```

---

## Pull Request (обязательный этап)

Вся работа попадает в `dev` только через Pull Request. Прямые пуши в `dev` или `main` запрещены.

1. Создать Pull Request из вашей ветки в `dev`.
2. Дождаться прохождения CI (автоматические проверки на сервере).
3. Пройти код-ревью и получить approve от коллег.
4. Если получены замечания:
   - внести правки локально, сделать коммиты и запушить;
   - **если за время ревью в `dev` появились новые изменения — снова выполнить rebase на `origin/dev`**.
5. После получения approve и успешного CI — выполнить мерж.

---

## Merge в dev (завершение задачи)

Используется **Rebase and Merge** или **Squash and Merge** через интерфейс GitHub/GitLab.

- **Rebase and Merge** (рекомендуется):
  накладывает коммиты ветки поверх `dev` без создания мерж-коммита.
  История остается линейной и чистой.

- **Squash and Merge** (допустимо):
  все коммиты ветки сжимаются в один с итоговым сообщением вида
  `SCRUM-17 feat: add login form`. Просто, но теряется детализация коммитов.

**Запрещено:** выполнять `git merge` локально и пушить мерж-коммит напрямую.
Это создает расходящуюся историю и сводит на нет преимущества rebase.

---

## Полный алгоритм от начала до мержа

### Этап 1: Начало задачи

```bash
git checkout dev
git pull origin dev
git checkout -b feature/SCRUM-17-login-form
```

### Этап 2: Разработка

- Регулярно коммитить в формате `SCRUM-17 feat: add login form`.
- Периодически обновлять ветку через rebase:

  ```bash
  git fetch origin
  git rebase origin/dev
  ```

- После rebase пушить с `--force-with-lease`:

  ```bash
  git push --force-with-lease
  ```

### Этап 3: Подготовка к PR

```bash
git fetch origin
git rebase origin/dev
pnpm check
git push --force-with-lease   # если ветка уже была на сервере
```

### Этап 4: Pull Request

- Создать PR в `dev`.
- Дождаться CI и код-ревью.
- При замечаниях — поправить, при необходимости снова сделать rebase на `dev`.

### Этап 5: Мерж

- Выполнить **Rebase and Merge** через интерфейс.
- Удалить ветку на сервере после успешного мержа.

---

## Rules

- Не пушьте напрямую в `main` или `dev`.
- Вся работа в `dev` попадает только через Pull Request.
- Перед созданием PR обязательно делайте финальный rebase и `pnpm check`.
- Не смешивайте feature, refactor и formatting в одном PR без необходимости.
- Не держите большие PR.
- Не меняйте `shared/ui` без согласования, если изменение влияет на другие команды.
- После rebase используйте только `git push --force-with-lease`.
  Использование `git push --force` запрещено.
