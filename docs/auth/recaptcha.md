# Google reCAPTCHA v3

## Назначение

В проекте используется Google reCAPTCHA v3 для защиты восстановления пароля (Forgot Password).

Текущая конфигурация:

- action: `password_reset`
- минимальный score: `0.5`

Проверка выполняется на backend.

Frontend только получает captcha token и передает его в mutation.

## Переменные окружения

### Frontend

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```

`NEXT_PUBLIC_GRAPHQL_ENDPOINT` — публичный URL backend GraphQL API, который использует Apollo
Client для auth-запросов.

`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` — публичный ключ Google reCAPTCHA.

Используется в браузере и безопасен для передачи на клиент.

### Backend

```env
RECAPTCHA_SECRET_KEY=
```

Секретный ключ Google reCAPTCHA.

Используется только на backend.

Никогда не должен попадать в frontend-код.

---

## Настройка локального окружения

Основной source of truth для локальной настройки проекта — [Project Start Guide](../project-start-guide.md).
Этот документ описывает только reCAPTCHA-specific детали.

Создайте локальный файл `.env.local` на основе `.env.example`.

`.env.example` коммитится в репозиторий и содержит только список переменных без реальных значений:

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```

Пример:

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://users.picboard.space/api/v1
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

После изменения переменных окружения перезапустите проект:

```bash
pnpm dev
```

Не кладите реальные ключи в `.env.example`.

---

## Production / CI / Docker

`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` и другие `NEXT_PUBLIC_*` переменные используются в клиентском
bundle, поэтому production-настройка должна учитывать этап сборки frontend.

В этом PR настройка production, CI, Docker и Jenkins не меняется. Любое изменение Dockerfile,
Jenkinsfile, Kubernetes deployment или runtime env для reCAPTCHA/API должно быть согласовано
отдельной задачей с DevOps/teamlead.

---

## Настройка доменов в Google reCAPTCHA

Для локальной разработки в настройках Google reCAPTCHA должны быть добавлены:

```text
localhost
127.0.0.1
```

Для production необходимо добавить реальные домены проекта.

Например:

```text
picboard.app
www.picboard.app
```

---

## Как работает Forgot Password

### 1. Пользователь вводит email

После нажатия кнопки отправки запускается reCAPTCHA.

### 2. Frontend получает captcha token

В форме выполняется:

```ts
executeRecaptcha('password_reset')
```

Google возвращает captcha token.

### 3. Frontend вызывает mutation

В GraphQL отправляется:

```graphql
input PasswordResetInput {
  email: String!
  captchaToken: String!
}
```

### 4. Backend проверяет token

Backend отправляет token в Google и проверяет:

- `success === true`
- `action === "password_reset"`
- `score >= 0.5`

Только после успешной проверки запускается логика восстановления пароля.

---

## Проверка работоспособности

Проверьте, что:

- указан `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`;
- указан `NEXT_PUBLIC_GRAPHQL_ENDPOINT`;
- приложение перезапущено после изменения `.env.local`;
- Forgot Password успешно отправляет запрос;
- request уходит на backend GraphQL URL, например `https://users.picboard.space/api/v1`;
- backend получает `email` и `captchaToken`.

---

## Возможные ошибки

### Localhost is not in the list of supported domains

Причина:

Текущий site key не разрешает работу на localhost.

Решение:

Добавить в настройках Google reCAPTCHA:

```text
localhost
127.0.0.1
```

или создать отдельный site key для разработки.

---

### executeRecaptcha is undefined

Проверьте:

- подключен `GoogleReCaptchaProvider`;
- задан `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`;
- приложение было перезапущено после изменения `.env.local`.

---

### Ошибка проверки reCAPTCHA на backend

Проверьте:

- frontend использует action:

```text
password_reset
```

- backend проверяет:

```text
action === "password_reset"
```

- backend использует порог:

```text
score >= 0.5
```

- frontend и backend используют ключи из одного проекта Google reCAPTCHA.

---

## Правила безопасности

### Не коммитить

Запрещено коммитить:

```text
.env
.env.local
.env.production
```

### Разрешено коммитить

Разрешено коммитить:

```text
.env.example
```

### Не использовать секретный ключ на frontend

`RECAPTCHA_SECRET_KEY` должен использоваться только на backend.

### Всегда проверять token на backend

Frontend не является доверенной средой.

Проверка reCAPTCHA должна выполняться только на сервере.
