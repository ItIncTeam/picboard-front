# Frontend Task Breakdown

Цель: разложить posts sprint на независимые small PRs для 4 frontend-разработчиков. Все tasks
сохраняют `app/` тонким и не добавляют GraphQL posts/upload operations до backend contract.

## Epics

### Epic 1: Create Post Wizard

Owner group: Dev 1, Dev 2, Dev 3.

Includes route modal, fallback page reuse, create flow state, upload UI, object URLs, crop, filters,
publication skeleton and final image export planning.

Target upload pipeline after backend contract:

```txt
final edited File -> request presigned URL -> PUT to storage -> save metadata through GraphQL -> createPost
```

GraphQL Upload is not used.

### Epic 2: Posts Consumption

Owner group: Dev 4 for first UI skeleton PR.

First PR includes only `entities/post`, `PostCard`, `PostGrid` and `PostDetails`. Edit/delete,
Main Page and Infinite Scroll are follow-up PRs.

## Общие правила

- Не менять Sidebar/auth/session/layout без отдельной задачи.
- Не добавлять dependencies в документационном PR.
- Dependency install PRs должны быть отдельными и маленькими.
- Не добавлять fake GraphQL operations.
- Не добавлять real presigned upload API helpers until backend contract is ready.
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
- storybook states.

Current:

- flow tests.

Future:

- backend integration review;
- draft architecture.

Checklist:

- [x] Проверить текущие exports `features/create-post`, `views/create-post-page`,
      `widgets/create-post-modal`.
- [x] Вынести единый `CreatePostFlow` в `features/create-post`.
- [x] Описать step enum: `upload`, `crop`, `filters`, `publication`.
- [x] Описать state type без `any`.
- [x] Подготовить frontend-only state fields/selectors for future upload pipeline: original file
      info, exported final file, upload status and saved metadata reference.
- [x] Добавить локальный reducer или hook для transitions.
- [x] Добавить selectors/helpers для `hasUnsavedData`.
- [x] Добавить selectors/helpers для readiness к presigned upload, но без API calls.
- [x] Подключить `CreatePostFlow` в modal shell.
- [x] Подключить тот же `CreatePostFlow` в fallback page.
- [x] Подготовить static desktop layout из Figma для crop step: header, back, `Next`, media area.
- [x] Поддержать step-dependent modal size на уровне modal shell, если shared modal ограничивает
      Figma layout.
- [x] Сохранить `app/(protected)/(main)/@modal/(.)posts/create/page.tsx` тонким adapter.
- [x] Сохранить `app/(protected)/(main)/posts/create/page.tsx` тонким adapter.
- [x] Реализовать close confirm только когда `hasUnsavedData === true`.
- [x] В close confirm использовать `Discard` / `Keep editing`; не показывать `Save draft`.
- [x] Оставить draft persistence disabled.
- [x] Добавить focused unit tests для reducer/helpers, если test setup уже позволяет.

Dependencies:

- Может стартовать сразу.
- Не зависит от backend contract.
- Должен предоставить state API для Dev 2 and Dev 3.
- Dev 2/3 не меняют `CreatePostState`, `CreatePostImage` or `CreatePostStep` без согласования с
  Dev 1.

Parallel work:

- Может идти параллельно с Dev 4 skeleton work.
- Должен согласовать state shape с Dev 2 and Dev 3 до merge upload/crop PRs.

## Dev 2: Upload, Validation And Object URLs

Goal: реализовать upload step на frontend без backend upload API.

Status: In Progress.

Checklist:

- [ ] Добавить `UploadStep` в `features/create-post`.
- [ ] Использовать native file input или существующий shared primitive, если подходит.
- [ ] Добавить accept list на основе pending backend decision, временно держать conservative
      frontend constants.
- [ ] Валидировать количество файлов.
- [ ] Валидировать file type.
- [ ] Валидировать file size после согласования лимита; до этого явно отметить лимит как
      blocked by backend contract в task note.
- [ ] Создавать object URLs только для selected files.
- [ ] Сохранять original file metadata in create flow state.
- [ ] Revoke object URLs при удалении файла.
- [ ] Revoke object URLs при unmount/reset flow.
- [ ] Поддержать reorder только если это нужно для MVP; иначе оставить planned.
- [ ] Показать validation errors без backend calls.
- [ ] Не добавлять upload GraphQL operations.
- [ ] Не добавлять real presigned upload API helpers.
- [ ] Не использовать GraphQL Upload.

Dependencies:

- Нужен state API от Dev 1.
- File limits зависят от backend/product answers.

Parallel work:

- UI upload shell можно делать параллельно с Dev 1 на временном local state.
- Final integration в общий flow после Dev 1.

## Dev 3: Crop, Filters And Final File Export

Goal: подготовить client-side image processing для готовых изображений, которые уйдут на backend.

Status: In Progress.

Checklist:

- [ ] Отдельным PR добавить dependency `react-advanced-cropper`.
- [ ] Добавить `CropStep`.
- [ ] Реализовать aspect ratio menu из Figma: `original`, `1:1`, `4:5`, `16:9`.
- [ ] Реализовать zoom control из Figma после подключения cropper.
- [ ] Реализовать image navigation arrows and active image switching.
- [ ] Поддержать выбранные aspect ratio modes.
- [ ] Поддержать zoom через cropper controls.
- [ ] Сохранять crop settings in state.
- [ ] Добавить `FiltersStep`.
- [ ] Реализовать wide filters layout из Figma: preview слева, filter grid справа.
- [ ] Определить минимальный набор filters для skeleton/MVP.
- [ ] Применять filters к preview.
- [ ] Экспортировать final image через canvas/blob.
- [ ] Сохранять final edited `File` в create flow state.
- [ ] Проверить, что exported image соответствует preview.
- [ ] Не отправлять файлы на backend до contract.
- [ ] Добавить cleanup для temporary object URLs generated from exported blobs.

Dependencies:

- Нужен upload state от Dev 2.
- Нужен create flow state от Dev 1.
- File format/output quality зависит от backend answers.
- Shared state shape changes must be agreed with Dev 1.

Parallel work:

- Crop/filter UI spike можно делать параллельно на local fixture image.
- Production integration после Dev 1 and Dev 2 state contracts.

## Dev 4: Posts Consumption Skeleton

Goal: подготовить первый UI skeleton для отображения posts без backend operations.

Scope: only posts display skeleton. Dev 4 does not work on create-post upload, crop, filters,
state shape or publish pipeline in this sprint split.

Status: In Progress.

Checklist:

- [ ] Подготовить `entities/post` display types. Они не являются backend contract.
- [ ] Добавить `PostCard` skeleton.
- [ ] Добавить `PostGrid` skeleton.
- [ ] Добавить `PostDetails` skeleton для `posts/[postId]`.
- [ ] Экспортировать public API из `entities/post`.
- [ ] Не подключать skeleton к profile/main routes без отдельного composition PR.
- [ ] Не добавлять queries до backend contract.
- [ ] Не добавлять edit/delete UI в first skeleton PR.
- [ ] Не добавлять main/public page UI в first skeleton PR.
- [ ] Не добавлять infinite scroll dependency в first skeleton PR.
- [ ] Документировать follow-up manual QA scenarios для profile/details.

Dependencies:

- Может стартовать параллельно с Dev 1.
- API integration blocked by backend contract.
- Profile/details route composition can follow after skeleton components are available.
- Infinite scroll implementation blocked until follow-up dependency PR and pagination contract.

Parallel work:

- `PostCard`, `PostGrid` and `PostDetails` can be built independently from Create Post Wizard.
- Profile/details composition is a follow-up PR after first skeleton is merged.

Follow-up PRs:

- Profile own posts composition.
- Post details route composition.
- Edit post skeleton.
- Delete post confirm skeleton.
- Main/public page skeleton.
- Infinite scroll after pagination contract and `react-intersection-observer` dependency PR.

## Что можно делать параллельно

- Dev 1 state shell and Dev 4 display skeleton.
- Dev 2 upload UI shell and Dev 3 crop/filter spike on isolated local fixture.
- Backend questions refinement and frontend skeleton PRs.
- Dependency PR planning for `react-advanced-cropper`, `embla-carousel-react`,
  `react-intersection-observer`.

## Что нельзя делать до backend contract

- GraphQL operations for posts.
- `createPost`, `updatePost`, `deletePost`, `getPostById`, `getUserPosts`, `getPublicPosts`,
  `getRegisteredUsersCount`.
- Real upload integration.
- Presigned URL API helpers before backend contract.
- GraphQL Upload for media files.
- Cache invalidation logic for posts.
- ISR/revalidation implementation tied to real backend fields.
- Exact file limits, if backend has not confirmed them.
- Public access assumptions beyond skeleton UI.

## Backend blockers

- Upload contract.
- `createPost`, `updatePost`, `deletePost`, `getPostById`.
- `getUserPosts`, `getPublicPosts`, `getRegisteredUsersCount`.
- Pagination strategy.
- File format, order and limits.
