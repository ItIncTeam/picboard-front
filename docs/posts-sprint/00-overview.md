# Posts Sprint Overview

Этот пакет документов фиксирует frontend-план для posts sprint. Он не заменяет общий
[Style Guide](../style_guide_full.md), [Architecture](../architecture.md) и
[App Router roadmap](../app-router-roadmap.md).

Figma review для Create Post flow: [Create Post Figma Review](./06-figma-review.md).

Backend contract для Posts Sprint: [Posts Backend Contract](./07-backend-contract.md).

Create Post upload service plan: [Upload Service Plan](./09-upload-service-plan.md).

## Gateway

- Production endpoint: `https://gateway.picboard.space/api/v1`
- Local endpoint: `http://localhost:3000/api/v1`

Posts Sprint GraphQL operations must use the gateway endpoint for the active environment.

## Обязательное чтение для команды

- [Create Post Flow](./04-create-post-flow.md);
- [Posts Backend Contract](./07-backend-contract.md);
- [Frontend Contracts](./08-frontend-contracts.md);
- [Upload Service Plan](./09-upload-service-plan.md).

## Цель спринта

Подготовить и начать реализацию posts vertical slice:

- CRUD posts;
- create post flow: upload -> crop -> filters -> publication -> publish;
- просмотр своих posts в профиле;
- post details, edit и delete flows;
- main page SSR/ISR;
- public main page с 4 latest posts и registered users count.

## Scope

### Epic 1: Create Post Wizard

- Route-based Create Post modal поверх protected `(main)` segment.
- Fallback page для прямого захода или reload `/posts/create`.
- Create Post UI shell with backend publish integration in `features/create-post`.
- Frontend state model для create flow.
- Upload validation и object URL lifecycle.
- Crop/filter/export flow, где frontend готовит final edited `File` для storage upload.
- Backend-confirmed upload pipeline: exported `File` -> `initiateUploadBatch` -> direct storage
  `PUT` -> `completeUpload` -> `createPost`.

### Epic 2: Posts Consumption

- Frontend display model for posts without claiming backend contract.
- `PostCard`, `PostGrid` and `PostDetails` skeletons.
- Follow-up planning для profile posts, post details, edit/delete and main/public pages.
- Документация backend questions без придумывания API.

## Out of scope

- Установка новых dependencies в документационном PR.
- New dependencies for upload/API integration.
- GraphQL Upload для media files. Frontend не отправляет файлы через GraphQL multipart.
- Реальный crop/filter implementation до отдельного feature PR.
- Edit/delete implementation in first UI skeleton PR.
- Main page SSR/ISR implementation in first UI skeleton PR.
- Infinite scroll implementation in first UI skeleton PR.
- Draft persistence в начале спринта.
- Confirm при закрытии без unsaved data.
- `Save draft` action из Figma до отдельного draft decision/implementation.
- Изменения Sidebar, auth/session/layout поведения.
- Stories, reels, video, moderation и other out-of-scope social features из
  [Project Brief](../project-brief.md).

## Текущий frontend state

- `src/app/(protected)/(main)/layout.tsx` уже содержит `@modal` slot.
- `src/app/(protected)/(main)/@modal/(.)posts/create/page.tsx` подключает route-based
  `CreatePostModal` для soft navigation.
- `src/app/(protected)/(main)/posts/create/page.tsx` остается fallback route для direct open/reload.
- Sidebar ведет Create на `/posts/create?returnTo=currentRoute`.
- `widgets/create-post-modal` закрывает modal через explicit safe `returnTo` и fallback `/main`.
- `features/create-post` содержит `CreatePostFlow`, frontend-only state contract, reducer,
  selectors, Close Confirm, Storybook states and focused tests for reducer/selectors/flow behavior.
- `features/create-post/api` contains typed Apollo helpers for `initiateUploadBatch`,
  `completeUpload` and `createPost`.
- `features/create-post/model/createPostUploadService.ts` orchestrates
  `initiateUploadBatch` -> storage `PUT` -> `completeUpload` and returns ordered `fileIds`.
- `CreatePostFlow` connects the default publish path to the upload service and `createPost`.
- `views/create-post-page` использует тот же `CreatePostFlow` для fallback page.
- `entities/post` содержит только frontend display types and skeleton UI. Это не backend contract.
- `widgets/posts-feed` пока не реализован.
- Backend подтвердил финальный Posts Sprint contract in
  [Posts Backend Contract](./07-backend-contract.md). Production code now has create-post scoped
  GraphQL helpers, upload service and publish integration.
- GraphQL Upload is not used. Binary files are uploaded directly to storage with `PUT`.
- Final upload schema uses `initiateUploadBatch(input: [InitiateUploadInput!]!)` and
  `completeUpload(input: [CompleteUploadInput!]!)`.
- Final posts schema includes `createPost`, `updatePostDescription`, `deletePost`, `profilePosts`,
  `feed` and `post`.
- `entities/post/api` contains typed Apollo helpers for `feed`, `post`, `profilePosts`,
  `updatePostDescription` and `deletePost`.
- Display images use `PostAttachmentEntity.file?.url`; `file` is nullable, while `file.url` is
  non-null. Attachments without a `file` are skipped. `uploadUrl` must not be used as a display URL.

## Current Progress

### Completed

- Route-based Create Post modal through the existing `@modal` slot.
- Direct `/posts/create` fallback page.
- Shared `CreatePostFlow` for modal and fallback page.
- Frontend-only `CreatePostState`, `CreatePostImage` and `CreatePostStep` contract.
- Create flow reducer for reset, step navigation, image list, active image and caption changes.
- Create flow selectors for unsaved data, image presence, active image, upload readiness, next and
  publish availability.
- Close Confirm shown only for unsaved data.
- Safe modal close through explicit `returnTo` with `/main` fallback.
- Auth routes and self `/posts/create` routes are blocked as close return targets.
- Storybook UI states: `Upload`, `CropWithMockImage`, `FiltersWithMockImage`,
  `PublicationWithExportedMockImage`, `CloseConfirm`.
- Focused reducer, selector and Create Post flow behavior tests.
- `CreatePostImage.id` is generated through `crypto.randomUUID()` and is the backend
  `clientUploadId`.
- Create Post API helpers for `initiateUploadBatch`, `completeUpload` and `createPost`.
- Posts API helpers for `feed`, `post`, `profilePosts`, `updatePostDescription` and `deletePost`.
- Feature-local upload service that maps descriptors only by `CreatePostImage.id` /
  `clientUploadId`, uploads `image.exported.file` via storage `PUT`, requires `READY`, and
  preserves `state.images` order for returned `fileIds`.
- Default publish integration in `CreatePostFlow` with publishing and error states.
- `PublicationStep` UI with exported image preview, caption textarea, character counter and
  description validation.
- Public Home integration with total `usersCount` and the backend-owned feed of at most 4 posts in
  `createdAt DESC` order.
- Public Home ISR with `revalidate = 60`, restored after the gateway HTTPS/TLS certificate blocker
  was resolved.
- Authenticated `/main` composition through Apollo `useQuery` with 60-second polling and the
  existing global latest-four `feed`; `/feed` is a compatibility redirect to `/main`.
- Public `/profile/[userId]` composition with `user(id)`, owner-only Profile Settings, an active
  60-second-polled first `profilePosts` page and cursor pagination through native
  `IntersectionObserver` plus Apollo `fetchMore`.
- Successful `createPost` starts non-blocking post-create synchronization: Apollo evicts
  `ROOT_QUERY.feed` and the owner's first Profile page, refetches affected active Feed/Profile
  queries, while a fixed-path Server Action invalidates Public Home. Synchronization failures are
  logged and never reopen the publish flow.

### In Progress

- Post details composition on top of the existing post display skeleton.

### Not Started

- Draft persistence architecture and implementation.

## Known limitations

- Crop canvas export is production-ready, including sequential multi-image processing and async
  stale-result protection. Full end-to-end Create Post still depends on the filters export PR.
- Apollo synchronization is implemented for create, edit and delete. Create evicts Feed and the
  created post owner's first `profilePosts(first: 8)` page; all mutations invalidate Public Home.
  Delete also evicts cached Post details and Profile posts.
- Partial upload failure behavior is fail-fast. Whether already uploaded files should be completed,
  retried or cleaned up after a later `PUT` failure needs backend/product clarification.
- Retry/idempotency behavior for expired `uploadUrl`, failed storage `PUT`, failed
  `completeUpload` and failed `createPost` remains open.

## Целевая архитектура

```txt
app/
  (profile)/
    profile/[userId]/page.tsx        -> public profile posts composition
  (protected)/(main)/
    @modal/(.)posts/create/page.tsx  -> route modal adapter
    posts/create/page.tsx            -> fallback page adapter
    posts/[postId]/page.tsx          -> post details route
  (public)/page.tsx                  -> public main page

views/
  create-post-page
  profile-page
  main-page
  public-home-page
  post-details-page

widgets/
  create-post-modal
  posts-feed       -> only if a future personalized feed contract needs reusable composition
  post-grid        -> only if grid becomes a widget-level composition

features/
  create-post
  edit-post
  delete-post      -> owner-only Post Details menu and confirmation flow

entities/
  post
```

Rules:

- `app/` остается тонким: только route adapters, layouts и slots.
- Views собирают страницы.
- Widgets собирают крупные UI blocks.
- Features содержат пользовательские действия.
- Entities содержат post types, model helpers и API после появления backend contract.
- Current `entities/post` types are frontend display types only.

## Roadmap To End Of Sprint

1. Finish filters and filtered `File` export on top of the implemented crop canvas export.
2. Compose post details and integrate `post(id: String!)`.
3. Add edit flow through `updatePostDescription` and integrate the prepared delete flow with Post
   Details.
4. Main feed composition through `feed` is complete; keep `/feed` as a compatibility redirect until
   a separate personalized feed contract exists.
5. Plan and implement cache/refetch behavior for edit.
6. Revisit draft persistence only if sprint capacity remains and product confirms behavior.

## Current team tasks

### Dev 1

- Own GraphQL operations, API wrappers, upload service, publish pipeline and `createPost`
  integration.
- Current create/upload integration is implemented for `initiateUploadBatch`, storage `PUT`,
  `completeUpload` and `createPost`.
- Next backend/API work is edit cache/refetch strategy and Post Details integration for edit/delete.

### Dev 2

- Upload step UI, validation, selected image previews, thumbnail selection/removal and selected
  image object URL cleanup are implemented.
- `CreatePostImage.id` generation uses the create-post feature helper and maps to backend
  `clientUploadId`.
- Follow-up work is optional upload status UI polish; `UploadStep` must still not call backend.

### Dev 3

- Crop UI, responsive modal layout and sequential canvas export to `image.exported` are complete.
- Next work is filter preview and filtered re-export without changing original image data.

### Dev 4

- Profile posts composition is complete.
- Post details composition loads `post(id)` on `/posts/[postId]` and owner Edit Post uses
  `updatePostDescription`, then invalidates Public Home through `revalidatePublicHome`. Close uses
  `getSafeReturnToPath` with fallback `/main`. Profile cards pass `returnTo=/profile/[userId]`.
  The same owner `...` menu opens `DeletePostFlow`; successful deletion synchronizes cached post
  surfaces and returns through the same sanitized `returnTo` as close.
- Render attachments only from `PostAttachmentEntity.file?.url`; skip attachments with `file: null`.

### Dev 5

- Own Filters step.
- Implement canvas export after filters.
- Own `exported.objectUrl` lifecycle.
