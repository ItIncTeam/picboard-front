# Auth Backend Contract

Source of truth: backend schema / Playground / actual backend contract.

`docs/schema.graphql` is a local schema source for IDE GraphQL validation only.
Keep it aligned with the backend contract, but do not treat it as the backend
source of truth. `docs/introspectionSchema.json` is kept for now, but it is not
a complete schema source for IDE validation because it does not include
`Query`/`Mutation` fields.

This document describes only the auth and user GraphQL contract present in the
current schema. Field names, required fields, and return types are copied from
the schema. Frontend route mapping uses the current App Router auth routes.

## Verified Through Playground

### Health Check

Request:

```graphql
query {
  __typename
}
```

Response:

```json
{
  "data": {
    "__typename": "Query"
  }
}
```

### `me` Without Token

The backend returns an auth error when `me` is called without a token:

```json
{
  "message": "Unauthorized",
  "code": "UNAUTHENTICATED",
  "statusCode": 401
}
```

### `signUp`

Verified success response shape:

```json
{
  "data": {
    "signUp": {
      "message": "Confirmation email sent",
      "user": {
        "id": "...",
        "email": "...",
        "username": "...",
        "isConfirmed": false
      }
    }
  }
}
```

Verified `username` validation:

- 6-30 characters.
- Lowercase and uppercase letters are allowed.
- `-` and `_` are the only allowed special characters.

Backend field-level validation error shape:

```json
{
  "field": "username",
  "message": "Username must be 6-30 characters..."
}
```

Confirmation email is delivered, but can land in spam. The confirmation link
contains the confirmation `code` in the query string.

### `emailConfirmation`

Request:

```graphql
mutation EmailConfirmation($input: EmailConfirmationInput!) {
  emailConfirmation(input: $input) {
    message
  }
}
```

Verified response:

```json
{
  "data": {
    "emailConfirmation": {
      "message": "If an account with that email exists, that email was confirmed"
    }
  }
}
```

### `signIn`

Invalid credentials response:

```json
{
  "message": "Invalid credentials",
  "code": "UNAUTHENTICATED",
  "statusCode": 401
}
```

Successful credentials return:

- `accessToken`
- `user`

Frontend decision:

- Store only `accessToken` in memory.
- `refreshToken` is managed by the backend through an `httpOnly` cookie.
- Frontend does not read, store, or manually send `refreshToken`.

## Queries

| Query  | Purpose                                 | Arguments     | Required arguments | Return type |
| ------ | --------------------------------------- | ------------- | ------------------ | ----------- |
| `me`   | Returns the current authenticated user. | None          | None               | `User!`     |
| `user` | Returns a user by id.                   | `id: String!` | `id`               | `User`      |

## Mutations

| Mutation                     | Purpose                                 | Input                     | Payload                           | Frontend flow                     |
| ---------------------------- | --------------------------------------- | ------------------------- | --------------------------------- | --------------------------------- |
| `signUp`                     | Registers a new user.                   | `SignUpInput!`            | `SignUpPayload!`                  | Sign Up                           |
| `emailConfirmation`          | Confirms registration email code.       | `EmailConfirmationInput!` | `EmailConfirmationPayload!`       | Confirm Registration              |
| `emailConfirmationResending` | Requests a new email confirmation code. | `ResendEmailInput!`       | `EmailResendConfirmationPayload!` | Resend Confirmation Email         |
| `signIn`                     | Authenticates a user.                   | `SignInInput!`            | `SignInPayload!`                  | Sign In                           |
| `logout`                     | Ends the current session.               | None                      | `String!`                         | Logout                            |
| `refreshToken`               | Issues a refreshed token payload.       | None                      | `RefreshTokenPayload!`            | Session Bootstrap / Token Refresh |
| `passwordReset`              | Starts password reset by email.         | `PasswordResetInput!`     | `PasswordResetPayload!`           | Forgot Password                   |
| `setNewPassword`             | Sets a new password using a code.       | `SetNewPasswordInput!`    | `SetNewPasswordPayload!`          | Create New Password               |

## Input Types

### `SignUpInput`

| Field           | Type       | Required |
| --------------- | ---------- | -------- |
| `email`         | `String!`  | Yes      |
| `username`      | `String!`  | Yes      |
| `password`      | `String!`  | Yes      |
| `acceptTerms`   | `Boolean!` | Yes      |
| `acceptPrivacy` | `Boolean!` | Yes      |

`username` validation verified through Playground:

- 6-30 characters.
- Lowercase and uppercase letters are allowed.
- `-` and `_` are the only allowed special characters.

### `EmailConfirmationInput`

| Field  | Type      | Required |
| ------ | --------- | -------- |
| `code` | `String!` | Yes      |

### `ResendEmailInput`

| Field   | Type      | Required |
| ------- | --------- | -------- |
| `email` | `String!` | Yes      |

### `SignInInput`

| Field      | Type      | Required |
| ---------- | --------- | -------- |
| `email`    | `String!` | Yes      |
| `password` | `String!` | Yes      |

### `PasswordResetInput`

| Field   | Type      | Required |
| ------- | --------- | -------- |
| `email` | `String!` | Yes      |

### `SetNewPasswordInput`

| Field      | Type      | Required |
| ---------- | --------- | -------- |
| `code`     | `String!` | Yes      |
| `password` | `String!` | Yes      |

## Payload Types

### `SignUpPayload`

| Field     | Type          | Required |
| --------- | ------------- | -------- |
| `user`    | `UserOutput!` | Yes      |
| `message` | `String!`     | Yes      |

### `SignInPayload`

Frontend sign-in integration requests `accessToken` and `user`.

| Field          | Type      | Required |
| -------------- | --------- | -------- |
| `user`         | `User!`   | Yes      |
| `accessToken`  | `String!` | Yes      |
| `refreshToken` | `String!` | Yes      |

### `EmailConfirmationPayload`

| Field     | Type      | Required |
| --------- | --------- | -------- |
| `message` | `String!` | Yes      |

### `EmailResendConfirmationPayload`

| Field     | Type      | Required |
| --------- | --------- | -------- |
| `message` | `String!` | Yes      |

### `PasswordResetPayload`

| Field     | Type      | Required |
| --------- | --------- | -------- |
| `message` | `String!` | Yes      |

### `SetNewPasswordPayload`

| Field     | Type      | Required |
| --------- | --------- | -------- |
| `message` | `String!` | Yes      |

### `RefreshTokenPayload`

Frontend session bootstrap requests only `accessToken` from `refreshToken`.

| Field          | Type      | Required |
| -------------- | --------- | -------- |
| `accessToken`  | `String!` | Yes      |
| `refreshToken` | `String!` | Yes      |

## User Types

### `User`

| Field                     | Type       | Required |
| ------------------------- | ---------- | -------- |
| `id`                      | `ID!`      | Yes      |
| `email`                   | `String!`  | Yes      |
| `username`                | `String!`  | Yes      |
| `confirmationCode`        | `String`   | No       |
| `confirmationCodeExpDate` | `DateTime` | No       |
| `isConfirmed`             | `Boolean!` | Yes      |
| `displayName`             | `String`   | No       |
| `bio`                     | `String`   | No       |
| `profilePictureFileId`    | `ID`       | No       |

### `UserOutput`

| Field         | Type       | Required |
| ------------- | ---------- | -------- |
| `id`          | `String!`  | Yes      |
| `email`       | `String!`  | Yes      |
| `username`    | `String!`  | Yes      |
| `isConfirmed` | `Boolean!` | Yes      |

## Session Strategy

### `accessToken`

The schema returns `accessToken: String!` from:

- `signIn`
- `refreshToken`

Frontend storage decision:

- Keep `accessToken` only in memory.
- Attach it to authenticated GraphQL requests through the Apollo auth link.
- Do not persist it in `localStorage`, `sessionStorage`, or frontend-managed
  cookies.

### `refreshToken`

Backend-confirmed decision:

- `refreshToken` is managed by the backend through an `httpOnly` cookie.
- Frontend has no access to the `refreshToken` value.
- Frontend must not read `refreshToken`.
- Frontend must not store `refreshToken`.
- Frontend must not manually send `refreshToken`.
- The `refreshToken` mutation uses the backend-managed cookie automatically.

### Bootstrap

After a full page reload, the in-memory `accessToken` is empty. The frontend
bootstrap flow calls:

1. `refreshToken`
2. Backend reads `refreshToken` from the `httpOnly` cookie.
3. Save `accessToken` in memory.
4. Call `me` to load the current `User`.

If `refreshToken` or `me` fails, the frontend clears the in-memory `accessToken` and treats the
session as anonymous.

Current frontend details:

- `SessionProvider` starts bootstrap on app start through `refreshSession()`.
- `refreshSession` deduplicates concurrent calls.
- A stale session-flow guard prevents an old bootstrap result from overwriting newer sign-in state.

### Sign-in session sync

Sign-in flow:

1. `signIn`
2. Save `accessToken` in memory.
3. Call `authenticateWithCurrentToken`.
4. `authenticateWithCurrentToken` calls `me`.
5. Session moves to `authenticated`.
6. The sign-in view redirects to the protected entry route.

Sign-in does not call `refreshToken`. `refreshToken` is only used for bootstrap/session restore.

### Auth error invalidation

Apollo `errorLink` handles `401`, `403`, and `UNAUTHENTICATED`:

1. Clear the in-memory `accessToken`.
2. Emit a shared auth session expired event from `shared/lib/auth`.
3. `SessionProvider` receives the event and moves session state to `anonymous`.
4. `ProtectedRouteBoundary` redirects anonymous users from protected pages.

This implementation does not include refresh-on-401 retry.

### Logout

Logout should call:

1. `logout`
2. Clear the in-memory `accessToken`.
3. Clear frontend session state for the current `User`.

## Frontend Mapping

| Route                             | Feature                                     | GraphQL Operation                 |
| --------------------------------- | ------------------------------------------- | --------------------------------- |
| `/auth/sign-up`                   | `features/auth/sign-up-form`                | `signUp`                          |
| `/auth/confirm/registration`      | `features/auth/confirm-registration`        | `emailConfirmation`               |
| `/auth/sign-in`                   | `features/auth/sign-in-form`                | `signIn`, `me`                    |
| `/auth/forgot-password`           | `features/auth/forgot-password-form`        | `passwordReset`                   |
| `/auth/confirm/password-recovery` | Pending password recovery confirmation view | No standalone operation in schema |
| `/auth/create-new-password`       | Pending create new password integration     | `setNewPassword`                  |
| Global session bootstrap          | `features/auth/session-management`          | `refreshToken`, `me`              |
| Protected route boundary          | `features/auth/session-management`          | Client session state              |
| Global logout action              | Pending                                     | `logout`                          |
| Resend confirmation action        | Pending resend confirmation action          | `emailConfirmationResending`      |

## Known Backend Decisions

- `refreshToken` is stored in an `httpOnly` cookie.
- Frontend does not read, store, or manually send `refreshToken`.
- `refreshToken` mutation uses the backend-managed cookie automatically.
- `accessToken` comes from GraphQL responses and is stored only in memory.
- Localhost with the production backend cannot fully verify F5 session restore because the
  production refresh cookie uses `SameSite=Lax`.

## Backend Confirmed Facts (June 2026)

- `signUp` verified.
- `emailConfirmation` verified.
- `me` unauthorized response verified.
- `accessToken` comes in the GraphQL response and is stored only in memory.
- `refreshToken` cookie flow confirmed: backend manages it through an
  `httpOnly` cookie, frontend has no access to it, does not store it, and does
  not send it manually.
- Registration confirmation canonical route:
  `/auth/confirm/registration?code=<CODE>`.
- The same registration confirmation route is used for confirmation email and
  resend confirmation email links.

## Future Auth Extensions

The current schema does not define extra auth-specific operations outside the
listed queries and mutations.

Types and fields that can support future user/profile work:

- Scalar-like schema reference: `DateTime` through
  `User.confirmationCodeExpDate`.
- Profile fields on `User`: `displayName`, `bio`, `profilePictureFileId`.
- `user(id: String!): User` can support public or profile user lookup flows
  when the frontend scope requires it.
