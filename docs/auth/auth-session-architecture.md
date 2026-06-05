# Auth Session Architecture

## Goal

Define how Picboard keeps an authenticated frontend session while keeping token handling minimal and aligned with the backend auth contract.

Core decisions:

- Frontend stores only `accessToken`.
- `accessToken` is memory only.
- `accessToken` comes from GraphQL responses.
- `refreshToken` is managed by the backend through an `httpOnly` cookie.
- Frontend does not read, store, or manually send `refreshToken`.

## Token Strategy

### Access Token

`accessToken` authorizes authenticated GraphQL requests.

Storage:

```txt
Memory Only
```

Allowed storage examples:

- React state
- Zustand store
- Apollo reactive variable

Do not persist `accessToken` in:

- `localStorage`
- `sessionStorage`
- frontend-managed cookies

Apollo `authLink` attaches the token to GraphQL requests:

```http
Authorization: Bearer <accessToken>
```

Apollo `errorLink` clears the in-memory access token on `401`, `403`, and `UNAUTHENTICATED`.

### Refresh Token

Backend-confirmed refresh token model:

- Backend stores and manages `refreshToken` through an `httpOnly` cookie.
- Frontend has no access to the `refreshToken` value.
- Frontend does not save `refreshToken` in frontend state.
- Frontend does not save `refreshToken` in `localStorage`.
- Frontend does not save `refreshToken` in `sessionStorage`.
- Frontend does not save `refreshToken` in frontend-managed cookies.
- Frontend does not manually send `refreshToken`.
- `refreshToken` mutation uses the cookie automatically.
- Backend plans to remove `refreshToken` from `RefreshTokenPayload`.

Session bootstrap should rely on backend-managed credentials with `credentials: 'include'`.

## Sign In Flow

```txt
User submits credentials
  ↓
signIn mutation
  ↓
Backend returns accessToken and user
  ↓
setAccessToken(accessToken)
  ↓
Redirect to protected route
```

After successful sign-in:

1. Save `accessToken` in memory.
2. Save `user` in frontend session state if the session model needs it.
3. Redirect to the protected entry route.

Invalid credentials are verified to return:

```json
{
  "message": "Invalid credentials",
  "code": "UNAUTHENTICATED",
  "statusCode": 401
}
```

## Authorized Requests

For authenticated GraphQL requests:

```txt
accessToken in memory
  ↓
authLink adds Authorization header
  ↓
GraphQL API
```

If the backend returns `401`, `403`, or `UNAUTHENTICATED`, the frontend clears the in-memory access token and treats the current session as unauthenticated.

## Refresh Flow

Confirmed runtime flow:

```txt
SignIn
  ↓
accessToken
  ↓
setAccessToken

401 / UNAUTHENTICATED
  ↓
refreshToken mutation
  ↓
backend reads refreshToken from httpOnly cookie
  ↓
new accessToken
  ↓
setAccessToken
```

## Application Bootstrap

After a full page reload, the in-memory `accessToken` is empty.

Bootstrap flow:

```txt
Page reload
  ↓
accessToken missing
  ↓
refreshToken mutation
  ↓
backend reads refreshToken from httpOnly cookie
  ↓
setAccessToken(returned accessToken)
  ↓
me query
  ↓
session user loaded
```

If `refreshToken` fails, the frontend keeps an anonymous session.

`me` without a token is verified to return:

```json
{
  "message": "Unauthorized",
  "code": "UNAUTHENTICATED",
  "statusCode": 401
}
```

## Logout Flow

```txt
User logs out
  ↓
logout mutation
  ↓
clear accessToken
  ↓
clear session state
  ↓
redirect to /auth/sign-in
```

Frontend sequence:

1. Call `logout`.
2. Clear the in-memory `accessToken`.
3. Clear frontend session state.
4. Redirect the user to `/auth/sign-in`.

## FSD Structure

### Entity

```txt
src/entities/session/
  model/
    types.ts
    session.ts
  index.ts
```

Responsibilities:

- Session types
- Session helpers
- `isAuthenticated()`

Session state must not include a client-managed `refreshToken`.

### Feature

```txt
src/features/auth/session-management/
  api/
  model/
  index.ts
```

Responsibilities:

- `useSession()`
- Session bootstrap
- Logout coordination
- Apollo integration

## Current Backend Status

Verified:

- Health check through `query { __typename }`
- `me` unauthorized response
- `signUp`
- `emailConfirmation`
- `signIn`
- `refreshToken` cookie flow

Available in schema / planned for integration:

- `logout`
- password recovery operations

## Backend Confirmed Facts (June 2026)

- `signUp` verified.
- `emailConfirmation` verified.
- `me` unauthorized response verified.
- `accessToken` comes in GraphQL responses and is stored only in memory.
- `refreshToken` cookie flow confirmed: backend manages it through an
  `httpOnly` cookie, frontend has no access to it, does not store it, and does
  not send it manually.
