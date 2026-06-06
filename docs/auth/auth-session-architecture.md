# Auth Session Architecture

## Goal

Define the current frontend auth session model for Picboard while keeping token handling minimal and
aligned with the backend auth contract.

Core decisions:

- Frontend stores only `accessToken`.
- `accessToken` is memory only.
- `accessToken` comes from GraphQL responses.
- `refreshToken` is managed by the backend through an `httpOnly` cookie.
- Frontend does not read, store, or manually send `refreshToken`.
- Frontend does not persist auth tokens in `localStorage` or `sessionStorage`.

## Root Providers

`src/app/layout.tsx` wraps the app with:

```txt
ApolloProvider
  SessionProvider
    app routes
```

`ApolloProvider` provides the shared Apollo Client. `SessionProvider` is a client session state
provider responsible for bootstrap, sign-in synchronization, and auth error invalidation.

## Token Strategy

### Access Token

`accessToken` authorizes authenticated GraphQL requests.

Storage:

```txt
Memory only
```

Do not persist `accessToken` in:

- `localStorage`
- `sessionStorage`
- frontend-managed cookies

Apollo `authLink` attaches the token to GraphQL requests:

```http
Authorization: Bearer <accessToken>
```

### Refresh Token

Backend-confirmed refresh token model:

- Backend stores and manages `refreshToken` through an `httpOnly` cookie.
- Frontend has no access to the `refreshToken` value.
- Frontend does not save `refreshToken` in frontend state.
- Frontend does not save `refreshToken` in `localStorage`.
- Frontend does not save `refreshToken` in `sessionStorage`.
- Frontend does not save `refreshToken` in frontend-managed cookies.
- Frontend does not manually send `refreshToken`.
- `refreshToken` mutation uses the backend-managed cookie automatically through
  `credentials: include`.

Session state must not include a client-managed `refreshToken`.

## Session State

`SessionProvider` owns client session state:

```txt
bootstrapping | authenticated | anonymous
```

- `bootstrapping`: initial app state while session restore is being attempted.
- `authenticated`: `me` has loaded the current user.
- `anonymous`: restore failed, sign-in failed after token sync, or auth was invalidated.

## Application Bootstrap

On app start, `SessionProvider` calls `refreshSession()`.

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
getMe
  ↓
authenticated
```

Failure flow:

```txt
refreshToken or getMe fails
  ↓
clearAccessToken
  ↓
anonymous
```

`refreshSession` deduplicates concurrent calls through a shared in-flight promise.

The session flow also has a stale request guard: older bootstrap results cannot overwrite newer
session transitions, such as a user signing in while bootstrap is still in flight.

## Sign In Session Sync

Sign-in does not call `refreshToken`.

Sign-in flow:

```txt
signIn
  ↓
setAccessToken
  ↓
authenticateWithCurrentToken
  ↓
getMe
  ↓
authenticated
  ↓
redirect to protected entry route
```

`refreshToken` is only used for bootstrap/session restore.

Invalid credentials are normalized in the sign-in form to:

```txt
Incorrect email or password
```

## Auth Error Refresh And Invalidation

Apollo `errorLink` handles:

- `401`
- `403`
- `UNAUTHENTICATED`

Refresh-on-401 flow:

```txt
authenticated GraphQL request
  ↓
401 or UNAUTHENTICATED
  ↓
refreshToken
  ↓
setAccessToken(new accessToken)
  ↓
retry original operation once
```

Concurrent `401` responses share one in-flight refresh promise. Only one `refreshToken` request is
sent; queued operations retry after the same refresh result resolves.

Refresh is skipped for:

- anonymous requests with no current `accessToken`;
- `SignIn`;
- `Logout`;
- `RefreshToken`;
- operations already retried once;
- `403` / `FORBIDDEN` errors.

Refresh failure falls back to the existing invalidation flow:

```txt
refreshToken fails or returns no accessToken
  ↓
clearAccessToken
  ↓
notifyAuthSessionExpired
  ↓
SessionProvider receives event
  ↓
anonymous
```

The shared event channel lives in `shared/lib/auth`. Apollo does not import `SessionProvider`,
`useSession`, or any feature/session-management module.

`accessTokenStore` keeps a token version counter. Clearing the token increments the version, and
refresh-on-401 captures the version before calling `refreshToken`. If logout or another session
transition clears/replaces the token while refresh is in flight, the stale refresh result is
discarded and the original operation is not retried.

## Protected Routes

`src/app/(protected)/layout.tsx` wraps `children` in `ProtectedRouteBoundary`.

`ProtectedRouteBoundary` is a client component and reads session state:

- `bootstrapping` shows a loading state;
- `anonymous` redirects to `/auth/sign-in`;
- `authenticated` renders `children`.

Redirect behavior stays in `ProtectedRouteBoundary`; protected layouts do not read cookies and do
not call backend APIs directly.

## Logout Flow

Logout is implemented.

Current sequence:

1. Call `logout`.
2. Clear the in-memory `accessToken`.
3. Clear frontend session state.
4. Move session state to `anonymous`.
5. Redirect the user to `/auth/sign-in`.

Intentional behavior:

If the logout mutation fails, the frontend still:

- clears the in-memory `accessToken`;
- clears local session state;
- redirects to `/auth/sign-in`.

This prioritizes local logout consistency over blocking logout because of a network or backend error.

Known limitation:

If the backend logout request fails and the refresh cookie remains valid, a future session bootstrap may restore the session through `refreshToken`.

The frontend still does not persist tokens or read/store the backend-managed refresh cookie.

## Localhost Restore Limitation

The production backend sets the refresh cookie with `SameSite=Lax`. Because of that, localhost
cannot fully verify F5 session restore against the production backend.

Full refresh-cookie restore verification requires a staging/dev environment or same-site
frontend/backend setup.

## Backend Confirmed Facts

- `signUp` verified.
- `emailConfirmation` verified.
- `signIn` verified.
- `me` unauthorized response verified.
- `refreshToken` cookie flow confirmed.
- `accessToken` comes in GraphQL responses and is stored only in memory.
- `refreshToken` is backend-managed through an `httpOnly` cookie; frontend does not read, store, or
  manually send it.
