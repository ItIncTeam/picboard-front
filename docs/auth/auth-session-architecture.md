# Auth Session Architecture

## Goal

Define how Picboard keeps an authenticated frontend session while keeping token handling minimal and aligned with the backend auth contract.

Core decisions:

- Frontend stores only `accessToken`.
- `accessToken` is memory only.
- Frontend does not store `refreshToken`.
- If backend returns `refreshToken` in a GraphQL payload, frontend ignores it.

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

The backend can return `refreshToken` from:

- `signIn`
- `refreshToken`

Frontend rules:

- Do not save `refreshToken` in frontend state.
- Do not save `refreshToken` in `localStorage`.
- Do not save `refreshToken` in `sessionStorage`.
- Do not save `refreshToken` in frontend-managed cookies.
- In production, omit `refreshToken` from mutation/query selection sets when it is not needed.

Session bootstrap should rely on backend-managed credentials with `credentials: 'include'`.

## Sign In Flow

```txt
User submits credentials
  ↓
signIn mutation
  ↓
Backend returns accessToken, refreshToken, user
  ↓
Frontend stores accessToken in memory
  ↓
Frontend ignores refreshToken
  ↓
Redirect to protected route
```

After successful sign-in:

1. Save `accessToken` in memory.
2. Save `user` in frontend session state if the session model needs it.
3. Ignore `refreshToken`.
4. Redirect to the protected entry route.

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

Available in schema / planned for integration:

- `refreshToken`
- `logout`
- password recovery operations
