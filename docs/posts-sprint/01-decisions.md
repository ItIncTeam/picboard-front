# Posts Sprint Decisions

## Зафиксированные решения команды

- Create открывается как route-based modal через существующий `@modal` slot.
- `/posts/create` остается fallback page для direct open/reload.
- Close behavior: сначала `router.back()`, если нет безопасной history - `router.replace('/main')`.
- Draft переносится в конец спринта; команда отдельно думает над его реализацией.
- `Save draft` из Figma не реализуется в early Create Post flow.
- Confirm при закрытии показывается только если есть unsaved data.
- Frontend отправляет на backend уже готовые изображения после crop/filter.
- Crop library: `react-advanced-cropper`.
- Carousel: `embla-carousel-react`.
- Infinite scroll: `react-intersection-observer`.
- Backend contract пока отсутствует, поэтому frontend готовит UI skeleton без GraphQL posts
  operations.
- GraphQL Upload для post media не используется.
- Upload pipeline: final edited `File` -> request presigned URL -> PUT to storage -> save metadata
  through GraphQL -> `createPost`.
- Backend contract для presigned URL и metadata mutation пока не готов, поэтому frontend не
  добавляет реальные API helpers, GraphQL operations или upload integration.
- Sprint is split into Epic 1: Create Post Wizard and Epic 2: Posts Consumption.
- Dev 1 is Create Flow Owner and owns `CreatePostState`, `CreatePostImage` and `CreatePostStep`.
- Dev 2 and Dev 3 do not change create-post state shape without Dev 1 approval.
- Dev 2 owns upload UI, frontend validation and object URL lifecycle.
- Dev 3 owns crop/filter UI and final edited `File` export.
- Dev 4 first UI skeleton PR focuses only on `entities/post`, `PostCard`, `PostGrid` and
  `PostDetails`.
- Edit/delete, Main Page and Infinite Scroll are follow-up PRs.
- Desktop behavior is route modal; mobile behavior is not confirmed and likely needs fullscreen
  wizard decision.
- Figma-generated code must not be copied directly. Use CSS modules, existing tokens and FSD
  boundaries.

## Почему route-based modal

Route-based modal лучше соответствует текущей App Router архитектуре проекта:

- `app/(protected)/(main)/layout.tsx` уже принимает `modal` slot;
- URL `/posts/create` остается shareable и может участвовать в browser history;
- пользователь не теряет контекст `/feed`, `/main` или `/profile/[userId]` при soft navigation;
- close/back/forward behavior остается routing concern, а не local state sidebar concern;
- future post details modal может использовать тот же routing pattern.

Local modal из Sidebar не выбран, потому что Sidebar должен оставаться navigation widget, а не
владеть create-post workflow state.

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

Пока эти решения не приняты, UI не должен показывать `Save draft`, даже disabled. Ранние PRs могут
добавить close confirmation только с actions `Discard` и `Keep editing`, и только когда
`hasUnsavedData === true`.

## Почему frontend отправляет готовое изображение

Frontend берет на себя crop/filter/export, чтобы storage получил уже финальный upload artifact:

- backend не должен повторять UI-specific crop/filter decisions;
- preview пользователя соответствует публикуемому результату;
- upload payload становится проще: final edited `File`;
- publication payload становится проще: saved media metadata references;
- backend contract может сосредоточиться на presigned URL, storage metadata, post creation and
  validation limits.

Backend все равно должен валидировать формат, размер, количество файлов и ownership.

## Почему не GraphQL Upload

Backend уточнил upload architecture: файлы не идут через GraphQL Upload/multipart. Frontend должен
получить presigned URL, загрузить final edited `File` напрямую в storage через `PUT`, сохранить
metadata через GraphQL mutation, а `createPost` позже должен ссылаться на сохраненную metadata.

До готового backend contract нельзя добавлять реальные upload helpers, GraphQL operations или fake
schema assumptions. Разрешены только frontend-only types, selectors and reducer tests, если они
помогают стабилизировать `CreatePostState`.

## Почему `react-advanced-cropper`

Выбран `react-advanced-cropper`, потому что он закрывает ожидаемые задачи create post flow:

- crop area и zoom;
- aspect ratio scenarios;
- image transform controls;
- export coordinates/canvas-friendly result;
- React integration без необходимости писать crop engine с нуля.

В этой документационной задаче dependency не устанавливается. Установка должна быть отдельным PR.

## Отложенные решения

- Draft persistence: в конец спринта после core publish path и отдельного architecture decision.
- Close confirmation: только после появления unsaved data model.
- Mobile Create Post behavior: likely fullscreen wizard, but requires product/design confirmation.
- Exact GraphQL operations: только после backend contract.
- Exact presigned URL request, storage PUT headers and metadata mutation shape: ждем backend.
- SSR/ISR settings для main/public pages: после backend query contract и cache requirements.
- Exact post media limits: ждем backend/product decision.
- Edit/delete implementation: follow-up after post details skeleton and backend permissions contract.
- Infinite scroll: follow-up after pagination contract and dependency PR.
- Moderation, reports, comments, likes: не входят в этот posts sprint slice, если отдельно не
  добавлены в backlog.
