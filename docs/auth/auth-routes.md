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

### `/auth/confirm/registration?code=...`

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
- The current route path is `/auth/confirm/registration`; the browser URL may include `?code=...`.

### `/auth/sign-in`

Frontend flow:

1. User submits credentials.
2. Frontend calls `signIn`.
3. Backend returns `accessToken`, `refreshToken`, and `user`.
4. Frontend stores only `accessToken` in memory.
5. Frontend ignores `refreshToken` and redirects to the protected entry route.

Verified invalid credentials error:

```json
{
  "message": "Invalid credentials",
  "code": "UNAUTHENTICATED",
  "statusCode": 401
}
```

Notes:

- `refreshToken` must not be saved in `localStorage`, `sessionStorage`, or frontend cookies.
- In production, the frontend mutation can omit `refreshToken` from the GraphQL selection set.

## Shell And Ownership

- Auth pages are public routes under `src/app/(public)/auth`.
- `page.tsx` files stay thin and import views.
- Views assemble page-level composition through `PublicAuthShell`.
- User actions and GraphQL hooks belong in `features/auth`.
- Session bootstrap and logout coordination belong in `features/auth/session-management`.
