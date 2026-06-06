# Auth Routes

This document maps current `/auth` routes to views, features, and verified GraphQL operations.

## Route Map

| Route                             | Page file                                                  | View / page                   | GraphQL operation       | Status                        |
| --------------------------------- | ---------------------------------------------------------- | ----------------------------- | ----------------------- | ----------------------------- |
| `/auth/sign-up`                   | `src/app/(public)/auth/sign-up/page.tsx`                   | `SignUpView`                  | `signUp`                | Integrated / backend verified |
| `/auth/confirm/registration`      | `src/app/(public)/auth/confirm/registration/page.tsx`      | `ConfirmRegistrationView`     | `emailConfirmation`     | Integrated / backend verified |
| `/auth/sign-in`                   | `src/app/(public)/auth/sign-in/page.tsx`                   | `SignInView`                  | `signIn`, `me`          | Integrated / backend verified |
| `/auth/forgot-password`           | `src/app/(public)/auth/forgot-password/page.tsx`           | `ForgotPasswordView`          | `passwordReset`         | Existing / contract verified  |
| `/auth/create-new-password`       | `src/app/(public)/auth/create-new-password/page.tsx`       | `CreateNewPasswordPage`       | `setNewPassword`        | Implemented                   |
| `/auth/confirm/password-recovery` | `src/app/(public)/auth/confirm/password-recovery/page.tsx` | `ConfirmPasswordRecoveryView` | No standalone operation | Implemented / bridge redirect |

## Password Recovery Routes

| Route                             | Page                          | Access | Status             |
| --------------------------------- | ----------------------------- | ------ | ------------------ |
| `/auth/forgot-password`           | `ForgotPasswordPage`          | Public | Existing           |
| `/auth/confirm/password-recovery` | `PasswordRecoveryConfirmPage` | Public | Implemented bridge |
| `/auth/create-new-password`       | `CreateNewPasswordPage`       | Public | Implemented        |

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
5. Frontend opens the current email-sent placeholder state.

Verified backend success message:

```json
{
  "message": "Confirmation email sent"
}
```

Notes:

- The confirmation email can land in spam.
- Backend validates `username` as 6-30 characters, with lowercase/uppercase letters and `-` or `_`.
- Final email-sent modal UI is still a follow-up; the mutation and success transition are wired.

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
5. Frontend calls `authenticateWithCurrentToken`.
6. `authenticateWithCurrentToken` calls `me` and moves session state to `authenticated`.
7. Frontend redirects to the protected entry route.

Verified invalid credentials error:

```json
{
  "message": "Invalid credentials",
  "code": "UNAUTHENTICATED",
  "statusCode": 401
}
```

Notes:

- Sign-in does not call `refreshToken`; refresh is only used for bootstrap/session restore.
- `refreshToken` is managed by the backend through an `httpOnly` cookie.
- Frontend does not read, store, or manually send `refreshToken`.

### `/auth/forgot-password`

Frontend flow:

1. User enters an email address.
2. Frontend executes reCAPTCHA with `password_reset`.
3. Frontend calls `passwordReset` with `email` and `captchaToken`.
4. Backend verifies captcha and starts password recovery.
5. Frontend shows an email-sent state.

Verified mutation shape:

```graphql
mutation PasswordReset($input: PasswordResetInput!) {
  passwordReset(input: $input) {
    message
  }
}
```

Notes:

- `captchaToken` is required by the live backend schema.
- The backend response payload only contains `message`.
- The frontend must not read, store, or send refresh tokens during this flow.

### `/auth/confirm/password-recovery?code=<CODE>`

Expected frontend flow:

1. Route reads `code` from the query string.
2. Frontend carries that code into the create-new-password flow.
3. User enters a new password.
4. Frontend calls `setNewPassword` with `code` and `password`.
5. Frontend sends the user to sign in after success.

Verified mutation shape:

```graphql
mutation SetNewPassword($input: SetNewPasswordInput!) {
  setNewPassword(input: $input) {
    message
  }
}
```

Notes:

- The assumed recovery link format is
  `/auth/confirm/password-recovery?code=<CODE>`.
- The route format is not verified from a real recovery email yet.
- `setNewPassword` returns only `message`; it does not return `accessToken` or
  `user`, so the frontend must not assume auto-login.

## Session And Protected Routes

Root layout wraps the app with `ApolloProvider`, then `SessionProvider`.
`SessionProvider` owns client session state and starts bootstrap on app start.

Bootstrap flow:

```txt
app start
  ↓
refreshSession()
  ↓
refreshToken
  ↓
setAccessToken
  ↓
me
  ↓
authenticated
```

If bootstrap fails, the frontend clears the in-memory access token and sets the session to
`anonymous`.

`refreshSession` deduplicates concurrent calls. The session provider also guards stale flows so an
older bootstrap result cannot overwrite a newer sign-in result.

`src/app/(protected)/layout.tsx` wraps protected route children in `ProtectedRouteBoundary`:

- `bootstrapping` shows a loading state;
- `anonymous` redirects to `/auth/sign-in`;
- `authenticated` renders `children`.

Auth error refresh and invalidation:

1. Apollo `errorLink` handles `401`, `403`, and `UNAUTHENTICATED`.
2. Eligible `401` / `UNAUTHENTICATED` errors on authenticated operations silently call
   `refreshToken`.
3. Concurrent `401` responses share one in-flight refresh request.
4. Refresh success stores the new memory-only access token and retries the failed operation once.
5. Refresh failure, ineligible operations, and `403` / `FORBIDDEN` errors clear the in-memory access
   token and emit a shared auth session expired event from `shared/lib/auth`.
6. `SessionProvider` subscribes to that event and moves session state to `anonymous`.
7. `ProtectedRouteBoundary` redirects anonymous users from protected pages.

The token store uses a version guard so an in-flight refresh cannot restore the token after logout.

Current limitation: localhost with the production backend cannot fully verify F5 session restore
because the production refresh cookie uses `SameSite=Lax`. Full refresh-cookie restore requires a
staging/dev environment or same-site frontend/backend setup.

Logout:

1. The protected header renders the feature-level logout action.
2. The action calls `logout`.
3. `SessionProvider` clears the memory-only access token and moves session state to `anonymous`.
4. The action redirects to `/auth/sign-in`.

The frontend does not persist tokens and does not read, store, or manually send the refresh token.

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
- Password recovery contract is verified, but the real recovery email link
  format is still unverified. Expected route:
  `/auth/confirm/password-recovery?code=<CODE>`.

## Shell And Ownership

- Auth pages are public routes under `src/app/(public)/auth`.
- `page.tsx` files stay thin and import views.
- Views assemble implemented auth flows through `AuthViewShell` and form/features from
  `features/auth`.
- User actions and GraphQL helpers belong in `features/auth`.
- Session bootstrap and logout coordination belong in `features/auth/session-management`.
