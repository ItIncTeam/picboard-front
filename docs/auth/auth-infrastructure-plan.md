# Auth Sprint Plan — Full Document

## 1. Goal

Подготовить инфраструктуру для auth flow на GraphQL + Apollo без дублирования UI и без преждевременной реализации бизнес-логики.

Основные задачи спринта:

- Apollo Client setup
- GraphQL codegen setup
- User/Session entities
- Auth features skeletons
- Session architecture
- Protected routes foundation
- Integration points для будущих UI компонентов

Не создавать новые UI-компоненты, если аналог уже существует или находится в процессе переноса из дизайна. Приоритет — инфраструктура, типизация и архитектурные границы.

---

## 2. FSD Структура

**src/app** — маршруты и layouts

- `(public)/auth/...` — публичные auth routes
- `(protected)/layout.tsx` — protected routes + session boundary
- `layout.tsx` — глобальный Apollo Provider для всего проекта

**src/views** — сборка страниц

- SignInPage
- SignUpPage
- ForgotPasswordPage
- CreateNewPasswordPage
- ConfirmRegistrationPage

**src/widgets** — UI shells и primitives

- PublicAuthShell — общая рамка для всех auth pages
- Header, Footer, Sidebar — для разных layouts

**src/features/auth** — действия пользователя (Client Components)

- sign-in, sign-up, confirm-registration, forgot-password, create-new-password, logout, session-management
- Внутри каждой feature:
  - `ui/` — React форма с `use client`
  - `model/` — types + validation schemas (zod)
  - `api/` — Apollo hooks: useMutation/useQuery

**src/entities/user, src/entities/session** — доменные типы и helpers

- user: id, email, username, roles, displayName, bio, profilePictureFileId
- session: accessToken, refreshToken, status, isAuthenticated()

**src/shared/api/apollo** — Apollo Client + Provider

- client.ts — инициализация Apollo Client
- provider.tsx — Client Component wrapper с 'use client'
- links/ — auth link, error link, http link
- graphql/generated — сгенерированные types/operations

**src/shared/lib/auth** — общие helpers

- routes.ts — константы маршрутов
- token-storage.ts — browser token abstraction

---

## 3. Backend Status (на текущий момент)

### Query

- me: User!
- user(id: String!): User
- \_entities(...): [_Entity]!
- \_service: \_Service!

### Mutation

- signUp(input: SignUpInput!): SignUpPayload!
- signIn(input: SignInInput!): SignInPayload!
- emailConfirmation(input: EmailConfirmationInput!): EmailConfirmationPayload!

### Available Inputs

- SignUpInput: email, username, password
- SignInInput: email, password
- EmailConfirmationInput: code

### Available Payloads

- SignUpPayload: user, message
- SignInPayload: user, accessToken, refreshToken
- EmailConfirmationPayload: user, message

### Missing Operations (нужны уточнения от backend)

- forgotPassword
- createNewPassword / passwordRecovery
- logout
- refreshToken mutation
- session / currentUser / me query (для полной сессии)

### Notes

- SignInPayload возвращает accessToken и refreshToken — можно использовать для session hook.
- Query me доступен — можно использовать для session bootstrap.

---

## 4. Sprint Tasks

### Entities

- [ ] Расширить user slice под GraphQL типы.
- [ ] Добавить чистые helpers: getDisplayName, hasRole, isConfirmed.
- [ ] Создать сущность session: accessToken, refreshToken, status.
- [ ] Добавить helpers: isAuthenticated(session).

### Features / Client Components

- [ ] Создать skeletons для sign-up, sign-in, confirm-registration.
- [ ] Настроить формы с react-hook-form + zod schemas.
- [ ] Настроить GraphQL mutations через Apollo hooks.
- [ ] Обработка form errors и router.push после success.
- [ ] Session-management: useSession hook, refresh + logout coordination.

### Shared / API

- [ ] Создать Apollo Client + auth, error, http links.
- [ ] Provider wrapper (`use client`) и подключение в root layout.
- [ ] Настроить graphql/generated и codegen для типов и операций.
- [ ] Разместить queries в entities, mutations в features.
- [ ] Token storage abstraction для accessToken / refreshToken.

### Views

- [ ] Подключить feature forms внутри PublicAuthShell.
- [ ] Создать отдельные views для ConfirmRegistration и PasswordRecovery.
- [ ] Page.tsx остаются тонкими адаптерами без state/API.

### App / Layouts

- [ ] Apollo Provider в `app/layout.tsx`.
- [ ] Session boundary в `(protected)/layout.tsx` с проверкой токена и redirect на /auth/sign-in.
- [ ] Проверить публичный shell в `(public)/layout.tsx`.

### Routing / Placeholder Checks

- [ ] Проверить все /auth routes и placeholders.
- [ ] Добавить states внутри forms: Email sent, validation errors, success, resend link, expired token.

### Backend Check / GraphQL

- [ ] Сверить introspection schema с feature models.
- [ ] Подтвердить какие поля возвращают payload types.
- [ ] Уточнить недостающие operations: forgot-password, create new password, logout, refresh token.
- [ ] Проверить хранение токенов: httpOnly cookie или frontend-managed token.

---

## 5. Out Of Scope For This Sprint

- Полная реализация Sign In UI / Sign Up UI / Forgot Password UI
- Pixel perfect верстка
- Protected redirects / middleware
- Refresh token automation
- Error UX states / notifications
- Любые UI primitives beyond PublicAuthShell
