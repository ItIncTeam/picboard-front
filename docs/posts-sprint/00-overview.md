# Posts Sprint Overview

Этот пакет документов фиксирует frontend-план для posts sprint. Он не заменяет общий
[Style Guide](../style_guide_full.md), [Architecture](../architecture.md) и
[App Router roadmap](../app-router-roadmap.md).

Figma review для Create Post flow: [Create Post Figma Review](./06-figma-review.md).

Backend contract для Posts Sprint: [Posts Backend Contract](./07-backend-contract.md).

Create Post upload service plan: [Upload Service Plan](./09-upload-service-plan.md).

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
- UI skeleton для Create Post без GraphQL posts operations in documentation-only work.
- Frontend state model для create flow.
- Upload validation и object URL lifecycle.
- Crop/filter/export flow, где frontend готовит final edited `File` для storage upload.
- Backend-confirmed upload pipeline: exported `File` -> `initiateUploadBatch` -> direct storage
  `PUT` -> `completeUploadBatch` -> `createPost`.

### Epic 2: Posts Consumption

- Frontend display model for posts without claiming backend contract.
- `PostCard`, `PostGrid` and `PostDetails` skeletons.
- Follow-up planning для profile posts, post details, edit/delete and main/public pages.
- Документация backend questions без придумывания API.

## Out of scope

- Установка новых dependencies в документационном PR.
- GraphQL posts operations in this documentation task.
- Реальная upload/API integration.
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
- `views/create-post-page` использует тот же `CreatePostFlow` для fallback page.
- `entities/post` содержит только frontend display types and skeleton UI. Это не backend contract.
- `widgets/posts-feed` пока не реализован.
- Backend подтвердил финальный Posts Sprint contract in
  [Posts Backend Contract](./07-backend-contract.md). Production code still has no posts/upload
  GraphQL operations or Apollo integration.
- GraphQL Upload is not used. Binary files are uploaded directly to storage with `PUT`.

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

### In Progress

- Upload step implementation: file selection, validation and object URL lifecycle.
- Crop and filters implementation, including final edited image export.
- Posts UI skeleton work for post display surfaces.

### Not Started

- Backend posts GraphQL operations in production code.
- `initiateUploadBatch` / storage `PUT` / `completeUploadBatch` / `createPost` integration.
- Draft persistence architecture and implementation.
- Main/public page SSR/ISR integration.
- Infinite scroll integration.

## Целевая архитектура

```txt
app/
  (protected)/(main)/
    @modal/(.)posts/create/page.tsx  -> route modal adapter
    posts/create/page.tsx            -> fallback page adapter
    posts/[postId]/page.tsx          -> post details route
    profile/[userId]/page.tsx        -> profile posts composition
  (public)/page.tsx                  -> public main page

views/
  create-post-page
  profile-page
  main-page
  public-home-page

widgets/
  create-post-modal
  posts-feed       -> follow-up, after profile/main composition decision
  post-grid        -> only if grid becomes a widget-level composition

features/
  create-post
  edit-post        -> follow-up PR after details skeleton/backend contract
  delete-post      -> follow-up PR after details skeleton/backend contract

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

## Порядок PR

1. Routing/modal skeleton уже подготовлен: Create открывается через `@modal`, direct `/posts/create`
   остается fallback page.
2. Minimal parallel-start skeleton: `CreatePostFlow` state contract and `entities/post` display
   skeleton.
3. Create Post visual shell from Figma: modal header, static step layout, desktop dimensions, no
   dependencies.
4. Upload step: file input, validation, object URLs, cleanup.
5. Crop integration: `react-advanced-cropper`, aspect ratio menu, zoom controls.
6. Media strip/carousel behavior: active image, ordering, optional `embla-carousel-react` PR.
7. Filters step: filter grid, preview, final image export planning.
8. Publication step skeleton: caption/tags UI, validation, submit boundary без GraphQL operation.
9. Backend contract documentation: зафиксировать `initiateUploadBatch`, direct storage `PUT`,
   `completeUploadBatch`, `createPost`, upload limits and cursor pagination. GraphQL Upload не
   использовать.
10. Publish integration: подключить `initiateUploadBatch` -> storage `PUT` ->
    `completeUploadBatch` -> `createPost` flow.
11. Profile posts composition using `PostGrid`, then API integration.
12. Post details composition using `PostDetails`, then API integration.
13. Edit/delete follow-up PRs.
14. Main/public page SSR/ISR planning and implementation после backend queries.
15. Infinite scroll follow-up after cursor pagination integration planning and dependency PR.
16. Draft persistence в конце спринта, если остается capacity и команда утвердит поведение.
