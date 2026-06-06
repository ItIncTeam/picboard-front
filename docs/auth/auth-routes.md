# Auth Routes

This document maps current `/auth` routes to views, features, and verified GraphQL operations.

## Route Map

| Route                             | Page file                                                  | View / page                   | GraphQL operation       | Status                        |
| --------------------------------- | ---------------------------------------------------------- | ----------------------------- | ----------------------- | ----------------------------- |
| `/auth/sign-up`                   | `src/app/(public)/auth/sign-up/page.tsx`                   | `SignUpView`                  | `signUp`                | Integrated / backend verified |
| `/auth/confirm/registration`      | `src/app/(public)/auth/confirm/registration/page.tsx`      | `ConfirmRegistrationView`     | `emailConfirmation`     | Integrated / backend verified |
| `/auth/sign-in`                   | `src/app/(public)/auth/sign-in/page.tsx`                   | `SignInView`                  | `signIn`, `me`          | Integrated / backend verified |
| `/auth/forgot-password`           | `src/app/(public)/auth/forgot-password/page.tsx`           | `ForgotPasswordView`          | `passwordReset`         | Contract verification pending |
| `/auth/create-new-password`       | `src/app/(public)/auth/create-new-password/page.tsx`       | `CreateNewPasswordPage`       | `setNewPassword`        | Placeholder / pending         |
| `/auth/confirm/password-recovery` | `src/app/(public)/auth/confirm/password-recovery/page.tsx` | Password recovery placeholder | No standalone operation | Placeholder / pending         |

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

Auth error invalidation:

1. Apollo `errorLink` handles `401`, `403`, and `UNAUTHENTICATED`.
2. It clears the in-memory access token.
3. It emits a shared auth session expired event from `shared/lib/auth`.
4. `SessionProvider` subscribes to that event and moves session state to `anonymous`.
5. `ProtectedRouteBoundary` redirects anonymous users from protected pages.

Current limitation: localhost with the production backend cannot fully verify F5 session restore
because the production refresh cookie uses `SameSite=Lax`. Full refresh-cookie restore requires a
staging/dev environment or same-site frontend/backend setup.

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
- Views assemble implemented auth flows through `AuthViewShell` and form/features from
  `features/auth`.
- User actions and GraphQL helpers belong in `features/auth`.
- Session bootstrap and logout coordination belong in `features/auth/session-management`.
