# Frontend Task Breakdown

Status: historical execution breakdown. The Posts sprint is complete and the final integration
review is `DEV READY`. Unchecked optional items below are not active sprint blockers.

Цель: разложить posts sprint на независимые small PRs для frontend-разработчиков. Все tasks
сохраняют `app/` тонким и не добавляют GraphQL posts/upload operations in documentation-only work.

## Epics

### Epic 1: Create Post Wizard

Owner group: Dev 1, Dev 2, Dev 3.

Includes route modal, fallback page reuse, create flow state, upload UI, object URLs, crop, filters,
publication skeleton and final image export planning.

Backend-confirmed target upload pipeline:

```txt
exported File -> initiateUploadBatch -> direct storage PUT -> completeUpload -> createPost
```

GraphQL Upload is not used.

Final gateway schema:

- endpoint: production `https://gateway.picboard.space/api/v1`, local
  `http://localhost:3000/api/v1`;
- upload mutations: `initiateUploadBatch(input: [InitiateUploadInput!]!)` and
  `completeUpload(input: [CompleteUploadInput!]!)`;
- posts mutations: `createPost`, `updatePostDescription`, `deletePost`;
- posts queries: `profilePosts(input: ProfilePostsInput!)`, unpaginated `feed`,
  `post(id: String!)`, and `usersCount: Int!`;
- display URL: `PostAttachmentEntity.file?.url`; nullable `file` must be tolerated and `file.url`
  is non-null after the `file` check.

### Epic 2: Posts Consumption

Owner group: Dev 4 for first UI skeleton PR.

The first PR included only `entities/post`, `PostCard`, `PostGrid` and `PostDetails`. The subsequent
Edit/Delete, Main and Profile pagination PRs are complete.

## Общие правила

- Не менять Sidebar/auth/session/layout без отдельной задачи.
- Не добавлять dependencies в документационном PR.
- Dependency install PRs должны быть отдельными и маленькими.
- Не добавлять fake GraphQL operations.
- Не добавлять real upload API helpers in this documentation PR.
- The implemented upload integration uses `initiateUploadBatch`, direct storage `PUT`,
  `completeUpload` and `createPost`.
- The implemented upload integration sends `purpose: POST_IMAGE` and maps browser MIME strings to
  `MimeType.JPEG` or `MimeType.PNG`.
- Не использовать GraphQL Upload для post media.
- Не хранить business logic в `page.tsx`.
- Не копировать Figma-generated code напрямую; переводить макет в CSS modules, tokens и FSD
  boundaries.
- Не добавлять `Save draft` до отдельного draft decision.
- Каждый PR обновляет docs, если меняет routing, behavior или implementation status.

## State ownership

- Dev 1 is Create Flow Owner.
- Dev 1 owns `CreatePostState`, `CreatePostImage` and `CreatePostStep`.
- Dev 2 and Dev 3 must not change state contract independently.
- Any change to create-post state shape must be agreed with Dev 1 before implementation.
- Dev 2 and Dev 3 can add local component UI state when it does not affect shared flow contract.

## Dev 1: Create Post Architecture, State And Modal Flow

Goal: подготовить основу create flow, которая одинаково работает в modal и fallback page.

Role: Create Flow Owner.

Status:

Completed:

- state contract;
- reducer;
- selectors;
- flow navigation;
- returnTo navigation;
- close confirm;
- step props/callback boundaries;
- publish boundary without backend implementation;
- storybook states.

Current:

- backend integration against the final gateway schema is complete.

Out of current scope:

- draft architecture requires a separate team decision.

Checklist:

- [x] Проверить текущие exports `features/create-post`, `views/create-post-page`,
      `widgets/create-post-modal`.
- [x] Вынести единый `CreatePostFlow` в `features/create-post`.
- [x] Описать step enum: `upload`, `crop`, `filters`, `publication`.
- [x] Описать state type без `any`.
- [x] Подготовить frontend-only state fields/selectors for upload pipeline: original file
      info, exported final file and upload readiness.
- [x] Добавить локальный reducer или hook для transitions.
- [x] Добавить selectors/helpers для `hasUnsavedData`.
- [x] Добавить selectors/helpers для readiness к backend upload flow, но без API calls.
- [x] Подключить `CreatePostFlow` в modal shell.
- [x] Подключить тот же `CreatePostFlow` в fallback page.
- [x] Подготовить static desktop layout из Figma для crop step: header, back, `Next`, media area.
- [x] Поддержать step-dependent modal size на уровне modal shell, если shared modal ограничивает
      Figma layout.
- [x] Сохранить `app/(app-shell)/@modal/(.)posts/create/page.tsx` тонким adapter.
- [x] Сохранить `app/(app-shell)/(protected)/(main)/posts/create/page.tsx` тонким adapter.
- [x] Реализовать close confirm только когда `hasUnsavedData === true`.
- [x] В close confirm использовать `Discard` / `Keep editing`; не показывать `Save draft`.
- [x] Оставить draft persistence disabled.
- [x] Добавить focused unit tests для reducer/helpers, если test setup уже позволяет.
- [x] Оформить step integration boundaries:
      `CreatePostFlow` owns reducer/state/selectors/navigation, while step components receive only
      props and callbacks.
- [x] Add default publish integration in `CreatePostFlow`; keep `onPublishAction` as an optional
      shell-level override for tests/stories.

Dependencies:

- Может стартовать сразу.
- Не зависит от backend contract.
- Должен предоставить state API and callback boundaries для Dev 2 and Dev 3.
- Dev 2/3 не меняют `CreatePostState`, `CreatePostImage` or `CreatePostStep` без согласования с
  Dev 1.

Parallel work:

- Может идти параллельно с Dev 4 skeleton work.
- Должен согласовать state shape с Dev 2 and Dev 3 до merge upload/crop PRs.

## Dev 2: Upload, Validation And Object URLs

Goal: реализовать upload step на frontend и передать выбранные изображения в общий create flow.

Status: Completed for the current Create Post PR.

Checklist:

- [x] Добавить `UploadStep` в `features/create-post`.
- [x] Использовать native file input или существующий shared primitive, если подходит.
- [x] Добавить accept list from confirmed backend contract: `image/jpeg`, `image/png`.
- [x] Валидировать количество файлов.
- [x] Валидировать file type.
- [x] Валидировать file size: maximum `20 MB`.
- [x] Валидировать количество изображений: minimum `1`, maximum `10`.
- [x] Генерировать stable unique `clientUploadId` для каждого image; target mapping:
      `CreatePostImage.id -> clientUploadId`.
- [x] Создавать object URLs только для selected files.
- [x] Сохранять original file metadata in create flow state.
- [x] Revoke object URLs при удалении файла.
- [x] Revoke object URLs при unmount/reset flow.
- Reorder was not required for the current scope and is not an active follow-up.
- [x] Показать validation errors без backend calls.
- [x] Add create-post scoped upload GraphQL helpers after backend contract confirmation.
- [x] Keep real upload API helpers out of `UploadStep`; backend calls are owned by
      `CreatePostFlow` and the feature-local upload service.
- [x] Не использовать GraphQL Upload.

Dependencies:

- Нужен state API от Dev 1.
- File limits are confirmed by backend contract.

Parallel work:

- UI upload shell можно делать параллельно с Dev 1 на временном local state.
- Final integration в общий flow после Dev 1.

## Dev 3: Crop And Post-Crop Export

Goal: подготовить crop flow and post-crop export data for the next filters/export step.

Status: Completed for the Posts sprint scope. Zoom remains a product-defined non-blocker.

Checklist:

- [x] Отдельным PR добавить dependency `react-advanced-cropper`.
- [x] Добавить `CropStep` boundary/skeleton.
- [x] Реализовать aspect ratio menu из Figma: `original`, `1:1`, `4:5`, `16:9`.
- [ ] Реализовать zoom только после подтверждения product semantics; текущий sprint этого не
      требует.
- [x] Реализовать image navigation arrows and active image switching.
- [x] Поддержать выбранные aspect ratio modes.
- [x] Сохранять crop settings in state.
- [x] Экспортировать image result после crop для downstream filters/canvas export.
- [x] Сохранять `image.exported` через agreed flow callbacks.
- [x] Проверить, что crop export соответствует crop preview.
- [x] Не отправлять файлы на backend из `CropStep`; backend upload is owned by the publish
      pipeline.

Dependencies:

- Нужен upload state от Dev 2.
- Нужен create flow state от Dev 1.
- Shared state shape changes must be agreed with Dev 1.

Parallel work:

- Crop UI spike можно делать параллельно на local fixture image.
- Production integration после Dev 1 and Dev 2 state contracts.

## Dev 4: Posts Consumption Skeleton

Goal: подготовить первый UI skeleton для отображения posts без backend operations.

Scope: only posts display skeleton. Dev 4 does not work on create-post upload, crop, filters,
state shape or publish pipeline in this sprint split.

Status: Completed. Main, Profile, Details, Edit and Delete composition is implemented and verified.

FRONT-150 completes the profile composition: `/profile/[userId]` is public, loads `user(id)` and
`profilePosts(first: 8)`, renders owner-only Profile Settings and appends cursor pages through a
native IntersectionObserver. Publication previews link to the canonical `/posts/[postId]` route.

Checklist:

- [x] Подготовить `entities/post` display types. Они не являются backend contract.
- [x] Добавить `PostCard` skeleton.
- [x] Добавить `PostGrid` skeleton.
- [x] Добавить `PostDetails` skeleton для `posts/[postId]`.
- [x] Экспортировать public API из `entities/post`.
- [x] Не подключать skeleton к profile/main routes без отдельного composition PR.
- [x] Не добавлять queries in the first skeleton PR.
- [x] Не добавлять edit/delete UI в first skeleton PR.
- [x] Не добавлять main/public page UI в first skeleton PR.
- [x] Не добавлять infinite scroll dependency в first skeleton PR.
- [x] Integrate the profile route with loading, error, empty and success states.
- [x] Add cursor pagination in pages of 8 without frontend sorting or slicing.
- [x] Compose `posts/[postId]` with `post(id)`, loading, error and not-found states.
- [x] Add owner Edit Post through `updatePostDescription`; description only, max 500 characters.
- [x] Cover Details close/edit/delete routing scenarios in regression tests.

Dependencies:

- Может стартовать параллельно с Dev 1.
- API integration blocked by implementation PR scope, not by missing profile pagination contract.
- `profilePosts` uses cursor pagination with `{ first, after? }` and current page size 8.
- Details route composition can follow after skeleton components are available.

Historical parallel work:

- `PostCard`, `PostGrid` and `PostDetails` can be built independently from Create Post Wizard.
- Profile/details composition was completed after the first skeleton merged.

Completed follow-up PRs:

- Delete post confirmation and synchronization flow.

## Dev 5: Filters And Canvas Export

Goal: implement filters, final canvas export and exported object URL lifecycle.

Role: Filters/Canvas Export Owner.

Status: Completed for the Posts sprint scope.

Checklist:

- [x] Добавить `FiltersStep` boundary/skeleton.
- [x] Реализовать wide filters layout из Figma: preview слева, filter grid справа.
- [x] Реализовать согласованный набор filters.
- [x] Применять filters к preview.
- [x] Экспортировать final image через canvas/blob.
- [x] Сохранять final edited `File` in `image.exported`.
- [x] Ensure exported files can map to backend `MimeType.JPEG` or `MimeType.PNG`.
- [x] Create `exported.objectUrl` only for exported blobs.
- [x] Revoke `exported.objectUrl` when replaced, reset or unmounted.
- [x] Проверить, что exported image соответствует preview.
- [x] Не отправлять файлы на backend из `FiltersStep`; backend upload is owned by the publish
      pipeline.

Dependencies:

- Needs Dev 1 state callbacks and publish boundary.
- Needs Dev 2 selected files and previews.
- Needs Dev 3 crop output.
- Backend integration starts after UI PR merge.

Parallel work:

- Filters UI can start with a local fixture.
- Final canvas export integration waits for Dev 3 crop output.

## Dev 1 Backend Integration

Status: completed.

Checklist:

- [x] Add GraphQL operation documents/wrappers for `initiateUploadBatch` and `completeUpload`.
- [x] Add GraphQL operation documents/wrappers for `updatePostDescription` and
      `deletePost`.
- [x] Add GraphQL operation documents/wrappers for `createPost`.
- [x] Add GraphQL operation documents/wrappers for `profilePosts`, `feed` and `post`.
- [x] Configure operation usage against gateway endpoint through the existing Apollo client links:
      production `https://gateway.picboard.space/api/v1`, local `http://localhost:3000/api/v1`.
- [x] Implement feature-local upload service.
- [x] Implement publish pipeline.
- [x] Integrate `createPost`.
- [x] Map `image/jpeg` -> `MimeType.JPEG` and `image/png` -> `MimeType.PNG`.
- [x] Send `purpose: POST_IMAGE` in every post image `InitiateUploadInput`.
- [x] Build `completeUpload` input as an array of `{ fileId }` items.
- [x] Treat only `FileStatus.READY` as publishable.
- [x] Keep display rendering on `PostAttachmentEntity.file?.url`; never use `uploadUrl` in post
      skeleton UI, and skip attachments with `file: null`.
- [x] Define delete cache/refetch behavior for Feed, Profile posts, Public Home and cached Post
      details.
- [x] Define cache/refetch behavior after create and update.

## Что можно делать параллельно

- Dev 1 state shell and Dev 4 display skeleton.
- Dev 2 upload UI shell and Dev 3 crop/filter spike on isolated local fixture.
- Backend questions refinement and frontend skeleton PRs.
- Dependency PR planning for `react-advanced-cropper`, `embla-carousel-react`,
  `react-intersection-observer`.

## Что нельзя делать без отдельной задачи

- UI composition for post edit/delete/profile/feed/details.
- Upload API helpers outside `features/create-post` for Create Post.
- GraphQL Upload for media files.
- Cache invalidation logic for posts outside dedicated create/delete integration tasks.
- Protected main page ISR/revalidation implementation tied to real backend fields.

## Backend blockers

Gateway schema is synchronized with the current Posts contract. `completeUpload` still requires
`READY` before `createPost`.

The gateway HTTPS/TLS certificate blocker is resolved, and Public Home uses ISR with
`revalidate = 60`.

Known non-blocking product/backend decision:

- retry/idempotency and orphan-file cleanup for failed upload and publish steps.
