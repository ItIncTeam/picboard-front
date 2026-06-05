# Auth Infrastructure Plan

## Goal

Prepare auth integration on top of the existing GraphQL + Apollo infrastructure without changing route boundaries or introducing a new auth approach.

This plan is documentation for the auth PR sequence. Implementation PRs should stay small and local.

## Current Frontend State

Already in place:

- `ApolloProvider` is connected globally in `src/app/layout.tsx`.
- Apollo Client is composed as `errorLink -> authLink -> httpLink`.
- `httpLink` uses `process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '/graphql'`.
- `credentials: 'include'` is enabled for GraphQL requests.
- `authLink` attaches `Authorization: Bearer <accessToken>` when an access token exists.
- `errorLink` clears the in-memory access token on `401`, `403`, and `UNAUTHENTICATED`.

Current token decision:

- Store `accessToken` in memory only.
- Do not store `refreshToken` on the frontend.
- Do not write `refreshToken` to `localStorage`, `sessionStorage`, or frontend-managed cookies.
- If `signIn` returns `refreshToken` in the payload, frontend ignores it.

## PR Breakdown

### PR 1: Auth API Operations

Scope:

- Add typed GraphQL operations for verified auth API calls.
- Keep operations in the proper FSD layer.
- Preserve existing UI behavior.

Out of scope:

- No UI behavior changes.
- No redirects.
- No session boundary.
- No token persistence changes.

### PR 2: Sign Up Integration

Scope:

- Connect `/auth/sign-up` to `signUp`.
- Handle backend field-level validation errors.
- Show success state after confirmation email is sent.

Backend facts:

- `signUp` is verified through Playground.
- Backend requires `username` to be 6-30 characters with lowercase/uppercase letters, `-`, and `_`.
- Confirmation email can land in spam.

### PR 3: Email Confirmation Integration

Scope:

- Read `code` from `/auth/confirm/registration?code=...`.
- Call `emailConfirmation`.
- Show confirmation result.

Backend facts:

- `emailConfirmation` is verified through Playground.
- The confirmation code is provided in the email link query string.

### PR 4: Sign In Integration

Scope:

- Connect `/auth/sign-in` to `signIn`.
- Store returned `accessToken` in memory.
- Ignore returned `refreshToken`.
- Redirect after successful sign-in.

Backend facts:

- `signIn` is verified through Playground.
- Invalid credentials return `UNAUTHENTICATED` with status code `401`.
- Successful sign-in returns `accessToken`, `refreshToken`, and `user`.

### PR 5: Session Management

Scope:

- Add session bootstrap.
- Call `refreshToken`, store the returned `accessToken` in memory, then call `me`.
- Treat failed bootstrap as an anonymous session.

Notes:

- `me` without a token is verified to return `UNAUTHENTICATED` with status code `401`.
- `refreshToken` should rely on backend-managed credentials; frontend must not persist the refresh token value.

### PR 6: Protected Boundary

Scope:

- Add protected route session boundary under `(protected)`.
- Redirect anonymous users to `/auth/sign-in`.
- Keep `page.tsx` files as thin adapters.

### PR 7: Logout

Scope:

- Call `logout`.
- Clear in-memory `accessToken`.
- Clear frontend session state.
- Redirect to `/auth/sign-in`.

### PR 8: Password Recovery

Scope:

- Integrate password recovery operations after backend behavior is verified.
- Cover `/auth/forgot-password`, `/auth/confirm/password-recovery`, and `/auth/create-new-password`.

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

## Out Of Scope

- New UI primitives.
- Route restructuring.
- Middleware.
- Frontend refresh token storage.
- `src/*` changes in this docs PR.
