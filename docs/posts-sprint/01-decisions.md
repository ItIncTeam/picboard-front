# Posts Sprint Decisions

## Зафиксированные решения команды

- Create открывается как route-based modal через существующий `@modal` slot.
- `/posts/create` остается fallback page для direct open/reload.
- Create modal close использует explicit `returnTo` query parameter from Sidebar navigation.
- `router.back()` не используется для Create modal close.
- Post details close использует существующий `getSafeReturnToPath` с fallback `/main`; `router.back()`
  для `/posts/[postId]` не используется.
- Auth routes and self `/posts/create` routes запрещены как close return target.
- Close fallback route is `/main`.
- Draft переносится в конец спринта; команда отдельно думает над его реализацией.
- `Save draft` из Figma не реализуется в early Create Post flow.
- Confirm при закрытии показывается только если есть unsaved data.
- Close confirmation actions are `Discard` and `Keep editing`.
- Storybook states `Upload`, `CropWithMockImage`, `FiltersWithMockImage`,
  `PublicationWithExportedMockImage` and `CloseConfirm` are official UI development states for
  Create Post Foundation.
- Frontend отправляет на backend уже готовые изображения после crop/filter.
- Crop library: `react-advanced-cropper`.
- Carousel: `embla-carousel-react`.
- Infinite scroll: `react-intersection-observer`.
- Backend contract для Posts Sprint зафиксирован в
  [Posts Backend Contract](./07-backend-contract.md). Production code now has create-post scoped
  helpers for `initiateUploadBatch`, `completeUpload` and `createPost`.
- Gateway endpoint is fixed: production `https://gateway.picboard.space/api/v1`, local
  `http://localhost:3000/api/v1`.
- GraphQL Upload для post media не используется.
- Upload pipeline: exported `File` -> `initiateUploadBatch` -> direct storage `PUT` ->
  `completeUpload` -> `createPost`.
- Upload mutations are `initiateUploadBatch(input: [InitiateUploadInput!]!)` and
  `completeUpload(input: [CompleteUploadInput!]!)`.
- The upload completion mutation is named `completeUpload`; do not use the old batch-suffixed
  mutation name.
- `InitiateUploadInput` fields are `clientUploadId`, `originalName`, `purpose`, `mimeType` and
  `size`.
- Posts upload must send `purpose: POST_IMAGE`.
- Backend upload enums are fixed: `MimeType` is `JPEG | PNG`; `FileStatus` is
  `PENDING | UPLOADED | READY | FAILED | DELETED`.
- Frontend must map `initiateUploadBatch` response by `clientUploadId`, not by array order.
- `CreatePostImage.id` is the only frontend image identity and equals backend `clientUploadId`.
- Do not add a separate `clientUploadId` field and do not match upload results by array index.
- `uploadUrl` is temporary, not a display URL, and must not be reused after expiration.
- `createPost` may be called only after all selected files are `READY`.
- Posts mutations are `createPost`, `updatePostDescription` and `deletePost`.
- Posts queries are `profilePosts(input: ProfilePostsInput!)`, unpaginated `feed` and
  `post(id: String!)`; `usersCount: Int!` is available for Public Main.
- Display image URL is `PostAttachmentEntity.file?.url`; `file` is nullable, `file.url` is
  non-null, and frontend skips attachments with `file: null`.
- Upload limits are confirmed: `image/jpeg` and `image/png`, 1-10 images, maximum `20 MB` per file.
- Post description is optional and limited to 500 characters.
- `profilePosts` uses cursor pagination with `{ first, after? }`; the live gateway schema defaults
  `first` to 8, and the current frontend guard accepts explicit values from 1 through 8.
- `/main` is the canonical authenticated home and reads the existing global latest-four `feed`
  reactively through Apollo Client. `/feed` is a compatibility redirect to `/main` until backend
  exposes distinct personalized feed semantics.
- Sprint is split into Epic 1: Create Post Wizard and Epic 2: Posts Consumption.
- Dev 1 is Create Flow Owner and owns `CreatePostState`, `CreatePostImage` and `CreatePostStep`.
- Dev 2 and Dev 3 do not change create-post state shape without Dev 1 approval.
- Dev 2 owns upload UI, frontend validation and object URL lifecycle.
- Dev 3 owns crop/filter UI and final edited `File` export.
- Dev 4 first UI skeleton PR focuses only on `entities/post`, `PostCard`, `PostGrid` and
  `PostDetails`.
- Dev 1 owns GraphQL operations, API wrappers, upload service, publish pipeline and `createPost`
  integration.
- Posts API foundation for `feed`, `post`, `profilePosts`, `updatePostDescription` and
  `deletePost` lives in `entities/post/api`.
- Dev 5 owns Filters, canvas export and `exported.objectUrl` lifecycle.
- Edit/delete, Main Page and Profile cursor pagination are implemented.
- Desktop behavior is route modal; mobile behavior is not confirmed and likely needs fullscreen
  wizard decision.
- Figma-generated code must not be copied directly. Use CSS modules, existing tokens and FSD
  boundaries.

## Почему route-based modal

Route-based modal лучше соответствует текущей App Router архитектуре проекта:

- `app/(app-shell)/layout.tsx` принимает `modal` slot;
- URL `/posts/create` остается shareable и может участвовать в browser history;
- пользователь не теряет контекст `/feed`, `/main` или `/profile/[userId]` при soft navigation;
- close/back/forward behavior остается routing concern, а не local state sidebar concern.

Local modal из Sidebar не выбран, потому что Sidebar должен оставаться navigation widget, а не
владеть create-post workflow state.

## Почему Create modal close использует explicit `returnTo`

Create route открывается как intercepted modal, но close behavior не должен зависеть от browser
history shape. Sidebar формирует `/posts/create?returnTo=currentRoute`, а modal shell валидирует
`returnTo` and calls `router.replace(safeReturnTo)`.

This keeps close deterministic:

- safe previous app route is restored through explicit URL state;
- `/auth` routes are not valid close targets;
- `/posts/create` and `/posts/create?...` are not valid close targets;
- missing or unsafe `returnTo` falls back to `/main`;
- `router.back()` is not used for Create modal close.

## Почему direct `/posts/create` остается fallback page

Direct open/reload не может восстановить previous page context для modal overlay. Fallback page
нужна, чтобы URL был устойчивым:

- reload `/posts/create` не ломает UX;
- deep link можно открыть напрямую;
- route adapter остается тонким и рендерит view;
- один и тот же create flow может использоваться modal и fallback page оболочками.

## Почему `Save draft` пока не реализуется

Figma показывает close confirmation с action `Save draft`, но это не является текущим frontend
scope. Draft требует отдельного продуктового и технического решения:

- где хранить draft: client state, local storage, backend или mixed strategy;
- какие данные входят в draft: original files, cropped/exported files, caption, filters, order;
- как восстанавливать object URLs and files после reload;
- как синхронизировать draft между devices, если это нужно;
- что делать с draft после successful publish.

Пока эти решения не приняты, UI не должен показывать `Save draft`, даже disabled. Current Close
Confirm contains only `Discard` and `Keep editing`, and opens only when `hasUnsavedData === true`.

## Почему Storybook states считаются официальными

Create Post Foundation фиксирует Storybook states как общий UI baseline for parallel work:

- `Upload`;
- `CropWithMockImage`;
- `FiltersWithMockImage`;
- `PublicationWithExportedMockImage`;
- `CloseConfirm`.

Dev 2 and Dev 3 should use these states for visual development until real upload, crop, filters and
export integration replace the mock image fixtures.

## Почему frontend отправляет готовое изображение

Frontend берет на себя crop/filter/export, чтобы storage получил уже финальный upload artifact:

- backend не должен повторять UI-specific crop/filter decisions;
- preview пользователя соответствует публикуемому результату;
- upload payload становится проще: final edited `File`;
- publication payload становится проще: `fileIds` plus optional description;
- backend contract can focus on upload descriptors, storage validation, post creation and validation
  limits.

Backend все равно должен валидировать формат, размер, количество файлов и ownership.

## Почему не GraphQL Upload

Backend уточнил upload architecture: файлы не идут через GraphQL Upload/multipart. Frontend должен
получить upload descriptors через `initiateUploadBatch`, загрузить `image.exported.file` напрямую в
storage через `PUT`, подтвердить загрузку через `completeUpload`, дождаться `READY` для всех
выбранных файлов и только потом вызвать `createPost` с `fileIds`.

`initiateUploadBatch` response must be mapped by `clientUploadId`. Frontend must not rely on array
order because backend can return upload descriptors in a different order.

`uploadUrl` is a temporary write URL for storage. It is not a display URL. Backend-confirmed post
rendering uses `PostAttachmentEntity.file?.url`.

Final gateway schema details:

- `initiateUploadBatch` accepts `[InitiateUploadInput!]!` and returns
  `[InitiateUploadPayload!]!`;
- `completeUpload` accepts `[CompleteUploadInput!]!` and returns `[CompleteUploadPayload!]!`;
- `purpose` must be `POST_IMAGE` for post images;
- frontend browser MIME strings must be mapped to GraphQL enum values `JPEG` or `PNG`;
- `FileStatus.READY` is required before `createPost`;
- post rendering must use `PostAttachmentEntity.file?.url`, tolerate nullable `file`, and treat
  `file.url` as non-null after the `file` check.

## Почему `react-advanced-cropper`

Выбран `react-advanced-cropper`, потому что он закрывает ожидаемые задачи create post flow:

- crop area и zoom;
- aspect ratio scenarios;
- image transform controls;
- export coordinates/canvas-friendly result;
- React integration без необходимости писать crop engine с нуля.

В этой документационной задаче dependency не устанавливается. Установка должна быть отдельным PR.

## Current boundaries

- Draft persistence and an alternative mobile wizard are outside the completed Posts sprint. They
  are not active work without a separate team/product decision.
- UI composition for `profilePosts`, `post`, `updatePostDescription` and `deletePost` is implemented.
  The current global `feed` composition runs on `/main` through Apollo Client rather than protected
  SSR/ISR.
- Public Home remains independent and uses ISR with `revalidate = 60` after the gateway HTTPS/TLS
  certificate blocker was resolved.
- Edit/delete and cursor-paginated Profile posts are implemented. Public Home has no pagination or
  infinite scroll.
- Moderation, reports, comments, likes: не входят в этот posts sprint slice, если отдельно не
  добавлены в backlog.

## Identity Rules

- CreatePostImage.id является единственным frontend identity изображения.
- id генерируется один раз при добавлении изображения.
- id никогда не изменяется.
- id используется как clientUploadId.
- Все операции выполняются по image.id.
- Индекс массива никогда не используется как identity.
