# Session Architecture

## Goal

Определить архитектуру пользовательской сессии для Picboard.

Основной принцип:

- Frontend работает только с `accessToken`
- Backend полностью управляет `refreshToken`
- `refreshToken` никогда не доступен JavaScript-коду

---

## Token Strategy

### Access Token

Используется для авторизации GraphQL запросов.

Хранение:

```txt
Memory Only
```

Примеры:

- React state
- Zustand store
- Apollo reactive variable

Access token не сохраняется в:

- localStorage
- sessionStorage
- cookies

---

### Refresh Token

Хранится только на backend.

Backend сохраняет refresh token в:

```txt
HttpOnly Cookie
```

Frontend не читает refresh token и не знает его значение.

---

## Login Flow

```txt
User
  │
  │ Sign In
  ▼
Backend
  │
  ├─ Set-Cookie(refreshToken)
  │
  └─ accessToken
        │
        ▼
Frontend
```

После успешного логина:

1. Backend создает accessToken.
2. Backend создает refreshToken.
3. Backend кладет refreshToken в httpOnly cookie.
4. Backend возвращает accessToken.
5. Frontend сохраняет accessToken в memory.

---

## Authorized Requests

Для GraphQL запросов:

```http
Authorization: Bearer <accessToken>
```

Apollo добавляет заголовок автоматически через auth link.

---

## Application Bootstrap

После обновления страницы:

```txt
F5
 ↓
accessToken отсутствует
 ↓
Frontend запрашивает session
 ↓
Backend читает refreshToken cookie
 ↓
Backend выдает новый accessToken
 ↓
Frontend сохраняет accessToken
 ↓
me query
 ↓
User loaded
```

Пользователь остается авторизованным.

---

## Session Flow

```txt
Frontend
    │
    ├─ accessToken
    │
    ▼
 GraphQL API
    │
    ├─ refreshToken (HttpOnly Cookie)
    ▼
 Backend
```

---

## Logout Flow

```txt
Frontend
   │ logout
   ▼
Backend
   │
   ├─ invalidate refreshToken
   ├─ clear cookie
   └─ success
```

Frontend:

1. Удаляет accessToken из памяти.
2. Сбрасывает session state.
3. Перенаправляет пользователя на `/auth/sign-in`.

---

## FSD Structure

### Entity

```txt
src/entities/session/

  model/
    types.ts
    session.ts

  index.ts
```

Ответственность:

- Session types
- Session helpers
- isAuthenticated()

---

### Feature

```txt
src/features/auth/session-management/

  api/
  model/

  index.ts
```

Ответственность:

- useSession()
- bootstrap session
- logout logic
- integration with Apollo

---

## Current Backend Status

Available:

### Query

```graphql
me
user
```

### Mutation

```graphql
signUp
signIn
emailConfirmation
```

Planned:

```graphql
refreshToken
logout
forgotPassword
createNewPassword
```

---

## Advantages

- Refresh token недоступен JavaScript.
- Защита от XSS.
- Frontend проще.
- Стандартный web authentication flow.
- Простая интеграция с Apollo.
