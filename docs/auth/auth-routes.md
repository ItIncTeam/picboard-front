# Auth Routes

This document maps current `/auth` routes to views, features, and verified GraphQL operations.

## Route Map

| Route                             | Page file                                                  | View                           | GraphQL operation       | Status                    |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------ | ----------------------- | ------------------------- |
| `/auth/sign-up`                   | `src/app/(public)/auth/sign-up/page.tsx`                   | `SignUpPage`                   | `signUp`                | Backend verified          |
| `/auth/confirm/registration`      | `src/app/(public)/auth/confirm/registration/page.tsx`      | `ConfirmRegistrationPage`      | `emailConfirmation`     | Backend verified          |
| `/auth/sign-in`                   | `src/app/(public)/auth/sign-in/page.tsx`                   | `SignInPage`                   | `signIn`                | Backend verified          |
| `/auth/forgot-password`           | `src/app/(public)/auth/forgot-password/page.tsx`           | `ForgotPasswordPage`           | `passwordReset`         | Schema only / not checked |
| `/auth/create-new-password`       | `src/app/(public)/auth/create-new-password/page.tsx`       | `CreateNewPasswordPage`        | `setNewPassword`        | Schema only / not checked |
| `/auth/confirm/password-recovery` | `src/app/(public)/auth/confirm/password-recovery/page.tsx` | Password recovery confirm view | No standalone operation | Planned                   |

## Verified Flow

Canonical registration confirmation route:

```txt
/auth/confirm/registration?code=<CODE>
```

Used by:

- Confirmation email.
- Resend confirmation email.

### `/auth/sign-up`

Frontend flow:

1. User submits the sign-up form.
2. Frontend calls `signUp`.
3. Backend creates an unconfirmed user.
4. Backend sends a confirmation email.
5. Frontend shows the success state.

Verified backend success message:

```json
{
  "message": "Confirmation email sent"
}
```

Notes:

- The confirmation email can land in spam.
- Backend validates `username` as 6-30 characters, with lowercase/uppercase letters and `-` or `_`.

### `/auth/confirm/registration?code=<CODE>`

Frontend flow:

1. Route reads `code` from the query string.
2. Frontend calls `emailConfirmation` with `EmailConfirmationInput`.
3. Backend confirms the account when the code is valid.
4. Frontend shows the confirmation result and a path to sign in.

Verified mutation:

```graphql
mutation EmailConfirmation($input: EmailConfirmationInput!) {
  emailConfirmation(input: $input) {
    message
  }
}
```

Verified backend response:

```json
{
  "message": "If an account with that email exists, that email was confirmed"
}
```

Notes:

- The `code` value comes from the email link query string.
- The canonical browser URL is `/auth/confirm/registration?code=<CODE>`.
- The same route is used for confirmation email and resend confirmation email.

### `/auth/sign-in`

Frontend flow:

1. User submits credentials.
2. Frontend calls `signIn`.
3. Backend returns `accessToken` and `user`.
4. Frontend stores only `accessToken` in memory.
5. Frontend redirects to the protected entry route.

Verified invalid credentials error:

```json
{
  "message": "Invalid credentials",
  "code": "UNAUTHENTICATED",
  "statusCode": 401
}
```

Notes:

- `refreshToken` is managed by the backend through an `httpOnly` cookie.
- Frontend does not read, store, or manually send `refreshToken`.

## Backend Confirmed Facts (June 2026)

- `signUp` verified.
- `emailConfirmation` verified.
- `me` unauthorized response verified.
- `accessToken` comes in GraphQL responses and is stored only in memory.
- `refreshToken` cookie flow confirmed: backend manages it through an
  `httpOnly` cookie, frontend has no access to it, does not store it, and does
  not send it manually.
- `/auth/confirm/registration?code=<CODE>` is the canonical route for
  confirmation email and resend confirmation email.

## Shell And Ownership

- Auth pages are public routes under `src/app/(public)/auth`.
- `page.tsx` files stay thin and import views.
- Views assemble page-level composition through `PublicAuthShell`.
- User actions and GraphQL hooks belong in `features/auth`.
- Session bootstrap and logout coordination belong in `features/auth/session-management`.
