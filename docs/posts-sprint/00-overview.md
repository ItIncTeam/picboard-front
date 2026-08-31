# Posts Sprint Overview

Этот документ фиксирует итоговое состояние Posts vertical slice. Инженерные правила остаются в
[Style Guide](../style_guide_full.md), [Architecture](../architecture.md) и
[App Router roadmap](../app-router-roadmap.md).

## Sprint status

**Posts sprint: COMPLETE**

Final integration review актуального `dev`: **DEV READY**.

Проверено:

- Create Post, Main, Profile, Post Details, Edit Post и Delete Post;
- общий routing через persistent `AppRouteShell`;
- Apollo cache synchronization, Profile pagination и 60-second polling Main/Profile;
- отображение backend `PostEntity.author`;
- полный cropped raster в Details/Edit через carousel `contain` mode;
- возврат после Delete через sanitized `returnTo` с `/main` fallback;
- Public Home server rendering и ISR в текущем согласованном scope.

Final verification:

- 73 test files, 498 tests passed;
- ESLint, Stylelint, Prettier и TypeScript/typegen passed;
- `git diff --check` passed;
- production build passed, 27 routes generated.

## Implemented scope

### Create Post

- Intercepted `/posts/create` modal and direct-open fallback render the same `CreatePostFlow`.
- Upload, crop, filters and publication steps prepare the final edited `File` per image.
- Publish uses `initiateUploadBatch` -> storage `PUT` -> `completeUpload` -> `createPost`.
- GraphQL Upload is not used; upload descriptors are matched by `clientUploadId`.
- Successful create synchronizes Feed, the owner's active Profile query and Public Home without
  turning synchronization failures into publish errors.

### Posts consumption and mutations

- `/main` renders the backend-owned latest feed through Apollo and polls every 60 seconds.
- Public `/profile/[userId]` loads public user data and keeps the first `profilePosts` page in an
  active Apollo query with 60-second polling.
- Profile pagination uses `fetchMore`; visible history is deduplicated and cursor revisions protect
  against stale responses after first-page changes or user transitions.
- Post Details maps backend author and attachments and gates owner actions by
  `sessionUser.id === PostEntity.ownerId`.
- Edit updates description, keeps the user on Details and synchronizes Feed/Public Home.
- Delete evicts the normalized post, Feed and Profile posts, then navigates through the same safe
  `returnTo` used by Close.
- Details and Edit display cropped images with `object-fit: contain`; Main/Public thumbnails keep
  their existing `cover` presentation.

### Public Home

- `/` remains a Server Component data path with ISR `revalidate = 60`.
- Create, Edit and Delete invalidate `/` through `revalidatePublicHome`.
- Browser-side polling is not used for Public Home.

## Current architecture

- `AppRouteShell` persistently owns the shared Main/Profile/Details application shell.
- Protected routes remain under `ProtectedRouteBoundary`; public Profile keeps its supported
  anonymous presentation.
- Create uses an intercepted route-modal plus a direct fallback page.
- Apollo owns Posts queries, normalized entities, active refetch and polling behavior.
- `PostEntity.author` is the presentation source for post authors; `ownerId` remains the ownership
  and permissions source.
- `PostAttachmentEntity.file?.url` is the display URL source. Nullable files are skipped.

Relevant implementation docs:

- [Posts Sprint Decisions](./01-decisions.md);
- [Create Post Flow](./04-create-post-flow.md);
- [UI Integration Plan](./05-ui-integration-plan.md);
- [Posts Backend Contract](./07-backend-contract.md);
- [Frontend Contracts](./08-frontend-contracts.md);
- [Upload Service Plan](./09-upload-service-plan.md).

## Gateway

- Production endpoint: `https://gateway.picboard.space/api/v1`
- Local endpoint: `http://localhost:3000/api/v1`

Posts GraphQL operations use the gateway endpoint for the active environment.

## Known follow-ups / non-blockers

- Backend avatar contract currently exposes `profilePictureFileId` without a usable display URL.
- Upload retry/idempotency and cleanup of orphan `READY` files require a separate backend/product
  decision.
- Profile reconciliation for posts deleted externally remains a separate edge case.
- Create zoom behavior remains out of scope until product defines its step, range and reset
  semantics.
- Anonymous `refreshToken` without a cookie may receive backend `INTERNAL_SERVER_ERROR` / HTTP 500;
  this is an auth/backend issue and not a Posts blocker.

Existing Radix `DialogContent` warnings in tests are also non-blocking and did not affect final
verification.

## Next documented stage

Next sprint is not defined in current project docs. Do not create a new sprint plan without a
separate team decision.
