# UI Integration Plan

This plan maps posts sprint code to the current FSD-like project structure. It follows
[Architecture](../architecture.md), [Layer Ownership](../layer-ownership.md), and
[App Router roadmap](../app-router-roadmap.md).

Create Post Figma notes are tracked in [Create Post Figma Review](./06-figma-review.md).

## FSD placement

### `app/`

Use for route adapters and modal slots only:

- `src/app/(protected)/(main)/@modal/(.)posts/create/page.tsx`;
- `src/app/(protected)/(main)/posts/create/page.tsx`;
- `src/app/(protected)/(main)/posts/[postId]/page.tsx`;
- future route adapters if needed.

Do not put forms, API calls, stores or complex UI in `app/`.

### `views/`

Use for page composition:

- `views/create-post-page`;
- `views/profile-page`;
- `views/main-page`;
- `views/public-home-page`;
- `views/post-details-page`.

### `widgets/`

Use for large UI composition:

- `widgets/create-post-modal`;
- `widgets/posts-feed`;
- `widgets/post-grid` if shared between profile and public/main;
- future profile posts section widget if profile page needs a dedicated block.

### `features/`

Use for user actions:

- `features/create-post`;
- `features/edit-post`;
- `features/delete-post`.

### `entities/`

Use first for frontend display skeletons, then for post data model after backend integration starts:

- `entities/post`;
- `Post`, `PostImage`, `PostCard`, `PostGrid`, `PostDetails` as frontend display skeletons;
- frontend mappers and type guards later if needed;
- query fragments/types only after schema is agreed.

### `shared/`

Use only for primitives and infrastructure:

- existing `shared/ui/modal`;
- existing Button/Input/TextArea primitives;
- no post-specific UI in `shared/ui`.

## Components

### `CreatePostFlow`

- Lives in `features/create-post`.
- Owns step state and transitions.
- Used by both modal and fallback page.
- Does not know whether it is rendered in modal or page.
- Owns Figma step composition for upload, crop, filters and publication.
- Dev 1 is Create Flow Owner and owns `CreatePostState`, `CreatePostImage` and `CreatePostStep`.
- Dev 2/3 do not change shared state shape without Dev 1 approval.

### `UploadStep`

- Lives in `features/create-post`.
- Handles file selection, validation and object URL creation.
- Does not call backend.
- Owned by Dev 2.
- Does not add real upload API helpers in upload UI work unless that PR explicitly owns backend
  integration.
- Does not use GraphQL Upload.

### `CropStep`

- Lives in `features/create-post`.
- Uses `react-advanced-cropper` after dependency PR.
- Saves crop settings into create flow state.
- Owns crop toolbar, aspect ratio menu, zoom controls, active image navigation and media strip.
- Owned by Dev 3 together with final edited `File` export.

### `FiltersStep`

- Lives in `features/create-post`.
- Applies preview filters.
- Prepares final export settings.
- Owns the desktop wide layout from Figma: preview panel plus filter grid.
- Export output is a final edited `File` that later enters the backend-confirmed upload pipeline.

### `PublicationStep`

- Lives in `features/create-post`.
- Handles caption/tags UI and publish boundary.
- Calls backend only after contract and API layer exist.
- Future publish pipeline is: exported `File` -> `initiateUploadBatch` -> direct storage `PUT` ->
  `completeUpload` -> `createPost`.

### `PostGrid`

- First skeleton lives in `entities/post/ui`.
- Move composition to `widgets/post-grid` or `widgets/posts-feed` only when route-level reuse needs
  widget ownership.
- Displays post thumbnails.
- Receives data as props.
- Does not fetch by itself until data boundary is agreed.

### `PostCard`

- Lives in `entities/post/ui` for first skeleton.
- Represents display-only post data.
- Feed-specific layout/actions should stay outside the entity.

### `PostDetails`

- Lives in `entities/post/ui`.
- Displays carousel slot, fallback author, description and date.
- Route-level loading, owner menu and edit composition live in `views/post-details-page`.

### `EditPostForm`

- Lives in `features/edit-post`.
- Edits only `description` through `updatePostDescription`, with a 500-character limit.
- Tracks dirty state: close without changes dismisses immediately; dirty close shows confirmation.
- After a successful save the user stays on `/posts/[postId]` and the visible post updates without a
  reload.
- After a successful save, invalidates Public Home through `revalidatePublicHome` (same Create/Delete
  pattern, including Feed cache eviction). A revalidation failure is logged and does not turn the
  successful save into a UI error.
- `EditPostMenu` is the single owner `...` menu. It always exposes Edit Post and can render Delete
  Post beside it when `onDeleteAction` is passed. Owner gating stays in Post Details; the menu does
  not check ownership again.

### `DeletePostFlow`

- Lives in `features/delete-post`.
- Exposes the Delete Post trigger boundary for future owner-only Post Details menu integration.
- Uses shared modal/dialog primitives for confirmation.
- Calls the existing `deletePost` API through the post entity public API.
- After a successful delete, synchronizes cached Feed/Profile posts and invalidates Public Home
  through the post entity server-only entrypoint.
- Always redirects to `/main` after a successful delete, even if post-success synchronization or
  callbacks fail.
- Does not own owner checks or the three-dots menu; Post Details owns that gate.

### `CreatePostCloseConfirm`

- Lives in `features/create-post` or locally under `widgets/create-post-modal` depending on where
  `hasUnsavedData` is owned.
- Opens only when `hasUnsavedData === true`.
- Uses `Discard` and `Keep editing` until draft persistence is explicitly designed.
- Does not implement `Save draft` in early sprint PRs.

## Modal and fallback page sharing

Both route shells should render the same feature flow:

```txt
@modal/(.)posts/create/page.tsx -> widgets/create-post-modal -> features/create-post/CreatePostFlow
posts/create/page.tsx           -> views/create-post-page     -> features/create-post/CreatePostFlow
```

Differences:

- modal shell owns route close behavior;
- modal shell owns desktop route-modal dimensions and may adjust width by step;
- fallback page owns page-level spacing/title;
- create flow owns state and step UI;
- backend integration later lives in feature/model/api boundaries, not in route adapters;
- backend integration must use `initiateUploadBatch`, direct storage `PUT`, `completeUpload`
  and `createPost`, not GraphQL Upload.

## Profile, main and details backend integration

### Profile

- `views/profile-page` composes the public user header and posts section.
- `/profile/[userId]` lives in the public `(profile)` route group; anonymous users receive the
  public shell and authenticated users retain the reusable app Header/Sidebar shell.
- `PostGrid` receives mapped `profilePosts` data in backend order.
- The first request uses `first: 8`; a native `IntersectionObserver` requests subsequent cursor
  pages with `after: pageInfo.endCursor`, so no additional dependency is required.
- Sidebar My Profile uses the current session user id and does not issue another `me` request.

### Main protected page

- `/main` is the canonical authenticated home. `views/main-page` composes the current global
  latest-four `feed` with Apollo `useQuery`, preserving backend order and using the shared auth
  refresh/retry links.
- `/feed` has no distinct personalized contract and redirects to `/main` for compatibility.
- The protected feed does not use raw server fetch or ISR because the access token is memory-only.
  Pagination and personalized/social semantics remain backend-unsupported.

### Public main page

- `/` stays in the `(public)` route group and uses the public layout/header.
- `views/public-home-page` composes `usersCount` and `feed` through the page-specific `PublicHome`
  query. Backend returns at most 4 posts ordered by `createdAt DESC`; frontend preserves that order
  and does not apply another limit. Public Home has no pagination or infinite scroll.
- The gateway HTTPS/TLS certificate blocker is resolved, so Public Home uses ISR with
  `revalidate = 60`. Empty `feed` and `usersCount = 0` remain valid successful data; gateway
  failures throw into the `(public)` route error boundary, whose retry re-fetches and re-renders the
  failed segment.
- `PostEntity` currently exposes only `ownerId`, not public author profile data. Public Home renders
  the local neutral `User`/avatar placeholder and does not store that fallback in the shared Post
  display model.
- Likes, comments, bookmarks and other social actions are outside the Public Home scope.

### Details

- `posts/[postId]/page.tsx` stays thin and passes `postId` into `views/post-details-page`.
- Details view loads the existing `post(id)` wrapper and maps attachments through `mapPostEntityToPost`.
- Author name and avatar stay local fallbacks (`User` / `U`) until the backend exposes author data.
  The page does not call `user(id)` for the post owner.
- Owner-only Edit Post is gated by comparing `SessionProvider.user.id` with `PostEntity.ownerId`.
- Close uses `getSafeReturnToPath` with fallback `/main`. Direct `/posts/[postId]` without `returnTo`
  goes to `/main`; `router.back()` is not used.
- Profile `PostGrid` passes `returnTo=/profile/[userId]` into `PostCard`, so closing details returns
  to that profile. Other grids omit `returnTo` and keep the `/main` fallback.
- Delete remains out of this composition and is owned by the separate delete-post follow-up. The
  owner `...` menu already has a slot for Delete Post next to Edit Post.

## Testing checklist

- Create flow reducer/helpers: step transitions, reset, unsaved data.
- Upload validation: file type, count, size after limits are known.
- Object URL lifecycle: revoke on remove/reset/unmount.
- Crop/filter export helpers: output exists and respects selected settings.
- Upload readiness selectors: require final exported files, without calling backend.
- Modal Escape, backdrop and direct dismiss use the Create flow close guard: no unsaved data closes;
  unsaved data opens the existing confirm.
- Fallback page renders same flow without modal close controls.
- Post grid renders empty/loading/error/success states.
- Delete confirm calls close/cancel handlers correctly before backend integration.

## Manual QA checklist

- Open `/main`, click Create in Sidebar. Confirm `/feed` redirects to `/main` for compatibility.
- Confirm URL becomes `/posts/create`.
- Confirm Create renders as modal over main layout.
- Close modal and confirm previous route is restored.
- Open `/posts/create` directly or reload it.
- Confirm fallback page renders, not overlay modal.
- On mobile, open Sidebar, click Create, confirm Sidebar closes as before.
- Select files in upload step, navigate steps, go back and verify state is preserved.
- Remove selected image and verify preview disappears.
- Close with no unsaved data: no confirm.
- Close with unsaved data: confirm appears.
- Profile page shows posts grid skeleton without backend calls.
- Public main page renders the real `usersCount + feed` response, distinguishes a successful empty
  feed from gateway failure, and delegates gateway failure recovery to the route error boundary.
