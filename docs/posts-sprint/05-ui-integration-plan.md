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
- future `views/post-details-page` if details route grows beyond current placeholder.

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

Use first for frontend display skeletons, then for post data model after backend contract:

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
- Does not add real presigned upload API helpers before backend contract.
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
- Export output is a final edited `File` that later enters the presigned upload pipeline.

### `PublicationStep`

- Lives in `features/create-post`.
- Handles caption/tags UI and publish boundary.
- Calls backend only after contract and API layer exist.
- Future publish pipeline is: final edited `File` -> request presigned URL -> PUT to storage ->
  save metadata through GraphQL -> `createPost`.

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

- Lives in `entities/post/ui` for first skeleton.
- Route-level composition can move into `views/post-details-page` later if details grows beyond the
  entity display boundary.

### `EditPostForm`

- Lives in `features/edit-post`.
- Starts as skeleton without mutation.
- Adds update mutation only after backend contract.
- Follow-up PR, not part of the first Posts Consumption skeleton.

### `DeletePostConfirm`

- Lives in `features/delete-post`.
- Uses shared modal/dialog primitives.
- Adds delete mutation only after backend contract.
- Follow-up PR, not part of the first Posts Consumption skeleton.

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
- backend integration must use presigned URL upload, not GraphQL Upload.

## Profile, main and details backend integration

### Profile

- `views/profile-page` composes profile header and posts section.
- `PostGrid` receives `getUserPosts` data after backend contract.
- Infinite scroll waits for pagination contract and `react-intersection-observer` dependency PR.

### Main protected page

- `views/main-page` or `views/feed-page` composes authenticated feed/main content.
- SSR/ISR decisions wait for backend query contract and cache requirements.

### Public main page

- `views/public-home-page` should show 4 latest posts and registered users count.
- Public access and cache policy wait for backend answers.
- Do not assume auth-required fields are available to anonymous users.
- Main/public page implementation is a follow-up PR, not part of the first Posts Consumption
  skeleton.

### Details

- `posts/[postId]/page.tsx` stays thin.
- Details view uses `getPostById` after backend contract.
- Edit/delete actions should be gated by backend viewer permissions such as `canEdit/canDelete` if
  provided.

## Testing checklist

- Create flow reducer/helpers: step transitions, reset, unsaved data.
- Upload validation: file type, count, size after limits are known.
- Object URL lifecycle: revoke on remove/reset/unmount.
- Crop/filter export helpers: output exists and respects selected settings.
- Presigned upload readiness selectors: require final exported files, without calling backend.
- Modal close behavior: no unsaved data closes; unsaved data opens confirm.
- Fallback page renders same flow without modal close controls.
- Post grid renders empty/loading/error/success states.
- Delete confirm calls close/cancel handlers correctly before backend integration.

## Manual QA checklist

- Open `/feed` or `/main`, click Create in Sidebar.
- Confirm URL becomes `/posts/create`.
- Confirm Create renders as modal over main layout.
- Close modal and confirm previous route is restored.
- Open `/posts/create` directly or reload it.
- Confirm fallback page renders, not overlay modal.
- On mobile, open Sidebar, click Create, confirm Sidebar closes as before.
- Select files in upload step, navigate steps, go back and verify state is preserved.
- Remove selected image and verify preview disappears.
- Close with no unsaved data: no confirm.
- Close with unsaved data: confirm appears after that feature is implemented.
- Profile page shows posts grid skeleton without backend calls.
- Public main page shows latest posts/users count skeleton without backend calls.
