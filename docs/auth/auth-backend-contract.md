# Auth Backend Contract

Source of truth: `/Users/semenkr/Downloads/schema.graphql`.

This document describes only the auth and user GraphQL contract present in the
current schema. Field names, required fields, and return types are copied from
the schema. Frontend route mapping uses the current App Router auth routes.

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

The schema returns `refreshToken: String!` from:

- `signIn`
- `refreshToken`

Known backend decision:

- `refreshToken` is managed by the backend through an `httpOnly` cookie.
- The frontend must not read or persist `refreshToken`.
- The `refreshToken` field is present in the GraphQL payload, but frontend
  session state must not depend on storing it.

### Bootstrap

After a full page reload, the in-memory `accessToken` is empty. The frontend
bootstrap flow should call:

1. `refreshToken`
2. Save returned `accessToken` in memory.
3. Call `me` to load the current `User`.

If `refreshToken` fails, the frontend should treat the session as anonymous.

### Logout

Logout should call:

1. `logout`
2. Clear the in-memory `accessToken`.
3. Clear frontend session state for the current `User`.

## Frontend Mapping

| Route                             | Feature                                                    | GraphQL Operation                 |
| --------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| `/auth/sign-up`                   | `features/auth/sign-up-form`                               | `signUp`                          |
| `/auth/confirm/registration`      | Confirm Registration feature not implemented yet           | `emailConfirmation`               |
| `/auth/sign-in`                   | Sign In feature not implemented yet                        | `signIn`                          |
| `/auth/forgot-password`           | Forgot Password feature not implemented yet                | `passwordReset`                   |
| `/auth/confirm/password-recovery` | Password Recovery confirmation feature not implemented yet | No standalone operation in schema |
| `/auth/create-new-password`       | Create New Password feature not implemented yet            | `setNewPassword`                  |
| Global session bootstrap          | Session Management feature not implemented yet             | `refreshToken`, `me`              |
| Global logout action              | Session Management feature not implemented yet             | `logout`                          |
| Resend confirmation action        | Confirm Registration feature not implemented yet           | `emailConfirmationResending`      |

## Known Backend Decisions

- `refreshToken` is stored in an `httpOnly` cookie.
- The frontend does not receive `refreshToken` as client-managed session state.
- `accessToken` is stored only in memory.

## Future Auth Extensions

The current schema does not define extra auth-specific operations outside the
listed queries and mutations.

Types and fields that can support future user/profile work:

- Scalar-like schema reference: `DateTime` through
  `User.confirmationCodeExpDate`.
- Profile fields on `User`: `displayName`, `bio`, `profilePictureFileId`.
- `user(id: String!): User` can support public or profile user lookup flows
  when the frontend scope requires it.
