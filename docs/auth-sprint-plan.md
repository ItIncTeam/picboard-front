# Auth Infrastructure Plan

## Goal

Prepare auth integration on top of the existing GraphQL + Apollo infrastructure without changing route boundaries or introducing a new auth approach.

This plan is documentation for the auth PR sequence. Implementation PRs should stay small and local.

## Current Frontend State

Already in place:

- `ApolloProvider` is connected globally in `src/app/layout.tsx`.
- `SessionProvider` is connected inside `ApolloProvider` in `src/app/layout.tsx`.
- Apollo Client is composed as `errorLink -> authLink -> httpLink`.
- `httpLink` uses `process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '/graphql'`.
- `credentials: 'include'` is enabled for GraphQL requests.
- `authLink` attaches `Authorization: Bearer <accessToken>` when an access token exists.
- `errorLink` silently refreshes eligible `401` / `UNAUTHENTICATED` failures, retries the failed
  operation once, and falls back to the shared auth session expired event when refresh fails.
- `SessionProvider` subscribes to the shared auth session expired event and moves the session to
  `anonymous`.
- `src/app/(protected)/layout.tsx` wraps children in `ProtectedRouteBoundary`.
- `ProtectedRouteBoundary` shows loading while bootstrapping, redirects anonymous users to
  `/auth/sign-in`, and renders children for authenticated users.

Current token decision:

- Store `accessToken` in memory only.
- `accessToken` comes from GraphQL responses.
- `refreshToken` is managed by the backend through an `httpOnly` cookie.
- Frontend does not read, store, or manually send `refreshToken`.
- `refreshToken` mutation uses the backend-managed cookie automatically.

## PR Breakdown

### PR 1: Auth API Operations — Done

Scope:

- Add typed GraphQL operations for verified auth API calls.
- Keep operations in the proper FSD layer.
- Preserve existing UI behavior.

Out of scope:

- No UI behavior changes.
- No redirects.
- No session boundary.
- No token persistence changes.

### PR 2: Sign Up Integration — Done

Scope:

- Connect `/auth/sign-up` to `signUp`.
- Handle backend field-level validation errors.
- Trigger the current email-sent placeholder after confirmation email is sent.

Backend facts:

- `signUp` is verified through Playground.
- Backend requires `username` to be 6-30 characters with lowercase/uppercase letters, `-`, and `_`.
- Confirmation email can land in spam.

Follow-up:

- Replace the email-sent placeholder with the final modal UI.

### PR 3: Email Confirmation Integration — Done

Scope:

- Read `code` from `/auth/confirm/registration?code=<CODE>`.
- Call `emailConfirmation`.
- Show confirmation result.

Backend facts:

- `emailConfirmation` is verified through Playground.
- The confirmation code is provided in the email link query string.
- `/auth/confirm/registration?code=<CODE>` is the canonical route for
  confirmation email and resend confirmation email.

### PR 4: Sign In Integration — Done

Scope:

- Connect `/auth/sign-in` to `signIn`.
- Store returned `accessToken` in memory.
- Call `authenticateWithCurrentToken`, which calls `me` and moves session state to
  `authenticated`.
- Redirect after successful sign-in.

Backend facts:

- `signIn` is verified through Playground.
- Invalid credentials return `UNAUTHENTICATED` with status code `401`.
- Successful sign-in returns `accessToken` and `user`.
- Backend manages `refreshToken` through an `httpOnly` cookie.
- Sign-in does not call `refreshToken`; refresh is only used for bootstrap/session restore.

### PR 5: Session Management — Done

Scope:

- Add session bootstrap.
- Call `refreshToken`; backend reads `refreshToken` from the `httpOnly` cookie.
- Store the returned `accessToken` in memory, then call `me`.
- Treat failed bootstrap as an anonymous session.
- Deduplicate concurrent `refreshSession` calls.
- Prevent stale bootstrap results from overwriting newer sign-in state.
- Invalidate session after Apollo auth errors through the shared auth session expired event.

Notes:

- `me` without a token is verified to return `UNAUTHENTICATED` with status code `401`.
- Frontend must not read, store, or manually send `refreshToken`.
- Localhost with the production backend cannot fully verify F5 restore because the production
  refresh cookie uses `SameSite=Lax`.

### PR 6: Protected Boundary — Done

Scope:

- Add protected route session boundary under `(protected)`.
- Redirect anonymous users to `/auth/sign-in`.
- Keep `page.tsx` files as thin adapters.

### PR 7: Logout — Done

Follow-ups: Logout flow

### PR 8: Password Recovery — Done

Scope:

- Integrate password recovery operations after backend behavior is verified.
- Cover `/auth/forgot-password`, `/auth/confirm/password-recovery`, and `/auth/create-new-password`.

Current status:

- Password recovery schema was verified.
- Forgot password calls `passwordReset`.
- Password recovery confirmation bridges to create-new-password.
- Create new password calls `setNewPassword`.
- Recovery code stays URL-only and is not persisted.

### PR 9: Refresh-on-401 Queue — Done

Scope:

- Refresh eligible authenticated `401` / `UNAUTHENTICATED` failures through `refreshToken`.
- Queue concurrent failures behind one in-flight refresh request.
- Retry the failed operation once with the refreshed memory-only `accessToken`.
- Fall back to session invalidation when refresh fails.
- Guard logout/session-clear races with an access-token version counter.

### Shared UI: Button Loading API — Done

Scope:

- `Button` supports `loading` and `loadingText`.
- Auth submit buttons use loading state during async submission.

### Remaining Priorities

1. OAuth placeholder fix — disable or hide visible provider buttons until the backend OAuth contract
   is verified.
2. `returnTo` after protected redirect.
3. Final SignUp email-sent modal UI.
4. Email confirmation resend UI.
5. OAuth implementation after backend contract and provider configuration are confirmed.
6. Password visibility accessibility cleanup in shared `Input`.
7. GraphQL Code Generator setup.

## FSD Placement

```txt
src/features/auth/
  sign-up/
  confirm-registration/
  sign-in/
  session-management/
  logout/
  password-recovery/

src/entities/session/
  model/

src/entities/user/
  model/

src/shared/api/apollo/
```

Rules:

- Mutations that represent user actions live in `features/auth`.
- Session helpers live in `entities/session` only if they are pure domain helpers.
- Apollo infrastructure stays in `shared/api/apollo`.
- Widgets and views do not store tokens, call auth APIs directly, or own session state.

## Out Of Scope For Completed Auth Infrastructure PRs

- New UI primitives.
- Route restructuring.
- Middleware.
- Frontend refresh token storage.
- Role-based access.

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
