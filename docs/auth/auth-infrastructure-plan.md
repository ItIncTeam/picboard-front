# Auth Infrastructure Plan

## Status

This document is superseded.

The auth infrastructure work described here has moved from planning into implementation. Keep this
file only as a redirect for older references.

Current source of truth:

- [Auth Sprint Plan](../auth-sprint-plan.md)
- [Auth Session Architecture](./auth-session-architecture.md)
- [Session Architecture](../session-architecture.md)
- [Auth Routes](./auth-routes.md)
- [Auth Backend Contract](./auth-backend-contract.md)

## Current Implementation Summary

- `src/app/layout.tsx` wraps the app with `ApolloProvider`, then `SessionProvider`.
- `ApolloProvider` provides the shared Apollo Client.
- `SessionProvider` is the client session state provider.
- `SessionProvider` starts bootstrap on app start through `refreshSession()`.
- `refreshSession` runs `refreshToken -> setAccessToken -> getMe -> authenticated`.
- Failed bootstrap clears the in-memory access token and moves session state to `anonymous`.
- `refreshSession` deduplicates concurrent calls.
- A stale session-flow guard prevents older bootstrap results from overwriting newer sign-in state.
- Sign-in runs `signIn -> setAccessToken -> authenticateWithCurrentToken -> getMe -> authenticated`.
- Sign-in does not call `refreshToken`; `refreshToken` is only for bootstrap/session restore.
- Apollo `errorLink` handles `401`, `403`, and `UNAUTHENTICATED`.
- On auth errors, `errorLink` clears the in-memory access token and emits a shared auth session
  expired event.
- `SessionProvider` subscribes to the shared auth session expired event and moves session state to
  `anonymous`.
- `src/app/(protected)/layout.tsx` wraps children in `ProtectedRouteBoundary`.
- `ProtectedRouteBoundary` shows loading while bootstrapping, redirects anonymous users to
  `/auth/sign-in`, and renders children for authenticated users.

## Token Rules

- `accessToken` is memory-only.
- `refreshToken` is backend-managed through an `httpOnly` cookie.
- Frontend does not read, store, or manually send `refreshToken`.
- Frontend does not persist auth tokens in `localStorage` or `sessionStorage`.

## Known Limitation

Localhost with the production backend cannot fully verify F5 session restore because the production
refresh cookie uses `SameSite=Lax`.

Full refresh-cookie restore verification requires a staging/dev environment or same-site
frontend/backend setup.
