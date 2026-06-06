# Picboard Auth PR Summary — Password Recovery Flow Completed

## Status

Password recovery flow is implemented and ready for review.

Completed:

- passwordReset GraphQL helper
- setNewPassword GraphQL helper
- ForgotPasswordForm API fix
- Password recovery confirm bridge
- Create new password form
- API tests
- Component tests
- Documentation updates

Source of truth remains:

- `docs/auth/auth-backend-contract.md`
- `docs/auth/auth-routes.md`
- `docs/auth/auth-session-architecture.md`
- `docs/auth/password-recovery-schema.md`

Files changed in this feature:

Created:

- `src/features/auth/api/passwordRecoveryApi.ts`
- `src/features/auth/api/tests/passwordRecoveryApi.test.ts`
- `src/views/auth/confirm-password-recovery/ConfirmPasswordRecoveryView.tsx`
- `src/views/auth/confirm-password-recovery/index.ts`
- `src/views/auth/confirm-password-recovery/confirm-password-recovery-view.module.css`
- `src/views/auth/confirm-password-recovery/__tests__/ConfirmPasswordRecoveryView.test.tsx`
- `src/features/auth/create-new-password-form/CreateNewPasswordForm.tsx`
- `src/features/auth/create-new-password-form/index.ts`
- `src/features/auth/create-new-password-form/create-new-password-form.module.css`
- `src/features/auth/create-new-password-form/createNewPasswordSchema.ts`
- `src/features/auth/create-new-password-form/__tests__/CreateNewPasswordForm.test.tsx`
- `src/features/auth/create-new-password-form/__tests__/createNewPasswordSchema.test.ts`
- `src/views/create-new-password-page/create-new-password-page.module.css`
- `docs/auth/password-recovery-schema.md`

Modified:

- `src/features/auth/forgot-password-form/ForgotPasswordForm.tsx`
- `src/views/create-new-password-page/CreateNewPasswordPage.tsx`
- `src/app/(public)/auth/confirm/password-recovery/page.tsx`
- `src/app/(public)/auth/create-new-password/page.tsx`
- `src/features/auth/index.ts`
- `src/features/auth/session-management/model/SessionProvider.browser.test.tsx`
- `docs/auth/auth-backend-contract.md`
- `docs/auth/auth-routes.md`
- `vitest.config.ts`

Deleted:

- `src/features/auth/forgot-password-form/api.ts`
- `docs/auth/password-recovery-analysis.md`
- `docs/auth/password-recovery-contract.md`

## Password Recovery Flow

```txt
/auth/forgot-password
  ↓
passwordReset({ email, captchaToken })
  ↓
backend sends recovery email
  ↓
/auth/confirm/password-recovery?code=<CODE>
  ↓
bridge redirects to /auth/create-new-password?code=<CODE>
  ↓
setNewPassword({ code, password })
  ↓
success message + Sign In link + automatic redirect to /auth/sign-in
```

The frontend does not store the recovery code in `localStorage`,
`sessionStorage`, cookies, or session state. The code is read from the URL and
sent only in the `setNewPassword` mutation.

## passwordReset Mutation

Implemented in `src/features/auth/api/passwordRecoveryApi.ts`.

Contract:

- mutation: `passwordReset(input: PasswordResetInput!)`
- input: `{ email: string; captchaToken: string }`
- output: `{ message: string }`

The helper uses the shared Apollo Client, plain async function style, colocated
types, and the same missing-payload fallback error pattern as existing auth API
helpers.

Used by `src/features/auth/forgot-password-form/ForgotPasswordForm.tsx`.

Acceptance checklist:

- [x] Uses correct mutation from schema
- [x] Accepts email + captchaToken
- [x] Returns message from backend
- [x] Error handling matches existing auth API pattern
- [x] Tests verify operation name, variables, success/error paths

## setNewPassword Mutation

Implemented in `src/features/auth/api/passwordRecoveryApi.ts`.

Contract:

- mutation: `setNewPassword(input: SetNewPasswordInput!)`
- input: `{ code: string; password: string }`
- output: `{ message: string }`

The helper does not expect `accessToken`, `user`, or refresh-token fields. The
schema returns only `message`, so the frontend sends users to sign in after a
successful password update.

Acceptance checklist:

- [x] Uses correct mutation from schema
- [x] Accepts code + password
- [x] Returns message from backend
- [x] Error handling matches existing auth API pattern
- [x] Tests verify operation name, variables, success/error paths

## ForgotPasswordForm Fix

The old feature-local API helper queried stale fields:

- `success`
- `score`
- `message`

The live schema returns only `message`. The form now imports `passwordReset`
from `@/features/auth/api/passwordRecoveryApi`.

No response handling change was needed because the form already treats a
resolved promise as success and uses `catch` for errors.

Acceptance checklist:

- [x] Uses new passwordRecoveryApi instead of old `./api`
- [x] Old `api.ts` deleted
- [x] No other files import old `api.ts`
- [x] Form still works: validation, captcha, loading, success, and error states

## Confirm Password Recovery Bridge

Implemented in `src/views/auth/confirm-password-recovery/ConfirmPasswordRecoveryView.tsx`.

Behavior:

- reads `code` through `useSearchParams`
- redirects with `router.replace` to
  `/auth/create-new-password?code=<CODE>` when code exists
- shows an invalid-link state when code is missing
- links missing-code users back to `/auth/forgot-password`

There is no mutation call here because the backend schema has no standalone
password-recovery confirmation endpoint. The code is consumed by
`setNewPassword`.

Acceptance checklist:

- [x] Route `/auth/confirm/password-recovery?code=XXX`
- [x] Extracts code via `useSearchParams`
- [x] Redirects to `/auth/create-new-password?code=XXX` when code present
- [x] Shows error with forgot-password link when code missing
- [x] Wrapped in `Suspense`
- [x] No mutation calls

## Create New Password Form

Implemented in `src/features/auth/create-new-password-form/CreateNewPasswordForm.tsx`.

States handled:

- missing code
- idle form
- validation errors
- submitting
- backend error with retry
- success

Validation uses the same password rules as sign-up:

- required password
- minimum 6 characters
- lowercase letter
- uppercase letter
- special character
- confirmation must match

The UI uses existing shared components and theme-driven styles:

- `AuthViewShell`
- `AuthFormCard`
- `Title`
- `Input`
- `Button`
- `Text`

No hardcoded dark palette overrides are used; shared components and semantic
theme tokens drive colors.

Acceptance checklist:

- [x] Route `/auth/create-new-password?code=XXX`
- [x] Reads code from URL
- [x] Password + confirm password fields
- [x] Validation matches sign-up rules
- [x] Calls `setNewPassword({ code, password })`
- [x] Success state with message + sign-in link + auto-redirect
- [x] Missing-code state with error + forgot-password link
- [x] Error state with retry
- [x] Code not stored in `localStorage` or `sessionStorage`
- [x] Timeout cleared on unmount

## Tests

Test coverage:

- `src/features/auth/api/tests/passwordRecoveryApi.test.ts`
  - operation names
  - variable shape
  - success payloads
  - missing-payload fallback errors
  - propagated Apollo errors
- `src/views/auth/confirm-password-recovery/__tests__/ConfirmPasswordRecoveryView.test.tsx`
  - loading state
  - redirect with code
  - missing-code error and forgot-password link
- `src/features/auth/create-new-password-form/__tests__/CreateNewPasswordForm.test.tsx`
  - missing code
  - password confirmation mismatch
  - mutation variables
  - success state
  - backend error retry
  - auto redirect
  - timeout cleanup
- `src/features/auth/create-new-password-form/__tests__/createNewPasswordSchema.test.ts`
  - password length rule
  - password complexity rule
  - password confirmation rule
  - valid password acceptance

Verification:

- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm exec prettier --check` on all password recovery changed files
- [x] passwordRecoveryApi tests pass
- [x] ConfirmPasswordRecoveryView tests pass
- [x] CreateNewPasswordForm tests pass
- [x] No regression in existing tests

## Documentation

Documentation updates:

- `docs/auth/auth-backend-contract.md` includes the verified password recovery
  contract.
- `docs/auth/auth-routes.md` includes implemented route status and expected
  flow.
- `docs/auth/password-recovery-schema.md` is kept as raw schema reference.
- `docs/auth/auth-session-architecture.md` remains unchanged because password
  recovery does not alter session/token strategy.

Acceptance checklist:

- [x] `auth-backend-contract.md` updated with password recovery section
- [x] `auth-routes.md` updated with new routes and status
- [x] `password-recovery-schema.md` kept as reference
- [x] No duplicate/analysis docs remain

## Code Quality

Patterns followed:

- Thin App Router page files.
- `useSearchParams` for query parameter extraction.
- `router.replace` for bridge redirect.
- Existing auth shell/card composition.
- Existing auth GraphQL helper style.
- Existing forgot-password form state pattern.
- Existing sign-up password validation rules.

Checklist:

- [x] Follows existing patterns: registration confirm and forgot-password form
- [x] Uses shared UI components
- [x] No hardcoded dark theme colors
- [x] Semantic theme tokens from components
- [x] No `localStorage` / `sessionStorage` token or code persistence
- [x] No refresh-token handling
- [x] No refresh-on-401 queue
- [x] Timeout cleanup prevents redirect after unmount
- [x] No shared-to-feature import boundary violation

## Review Outcome

Critical:

- None found.

Major:

- None found.

Minor:

- None found.

Nice to have:

- Confirm the real backend email link format once a valid recovery email can be
  generated.
- Consider adding an E2E happy path in a staging environment where reCAPTCHA and
  email delivery are configured.

Merge readiness:

- Ready

## Environment Limitation

Localhost password recovery cannot be fully verified against the production
backend unless reCAPTCHA is configured for local development.

Known limitation:

- Local `.env.local` can provide a public site key, but backend captcha
  verification still depends on a matching backend `RECAPTCHA_SECRET_KEY`,
  allowed domains, action `password_reset`, and score threshold.

Recommended verification path:

- Use a staging or same-site environment with matching frontend site key and
  backend secret.
- Use a separate reCAPTCHA development key for localhost with `localhost` and
  `127.0.0.1` allowed.
- Do not add frontend-only captcha bypass logic.
