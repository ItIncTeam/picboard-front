# 📘 Шпаргалка для спринта по постам

Быстрый справочник для разработчиков. Основной источник истины — бэкенд-контракт, фронтенд-контракты и план сервиса загрузки.

---

## Общие правила

- Gateway endpoint: production `https://gateway.picboard.space/api/v1`, local
  `http://localhost:3000/api/v1`.
- `CreatePostImage.id` — единственный frontend идентификатор изображения и бэкендовский
  `clientUploadId`.
- Не добавляй отдельное поле `clientUploadId`.
- Никогда не сопоставляйте изображения, дескрипторы загрузки или вложения по индексу в массиве.
- Для загрузки используйте `image.exported.file`, а не оригинальный `image.file`.
- `uploadUrl` предназначен только для прямого `PUT`-запроса в хранилище; **никогда не показывайте его в UI**.
- `uploaded` ≠ `ready`; статус `ready` приходит только после вызова `completeUpload`.
- `createPost` можно вызывать только когда все выбранные файлы имеют статус `ready`.
- Изображения постов отображаются из `attachment.file.url`.
- В текущем продакшен-коде есть create-post scoped GraphQL helpers, feature-local upload service
  and default publish integration.

---

## Разработчик 1 — Владелец Create Flow

**Отвечает за:**

- `CreatePostState`, `CreatePostImage`, редьюсер, селекторы и навигацию по шагам мастера.
- Границы между шагами: `CreatePostFlow` → загрузка → кадрирование → фильтры → публикация.
- Default publish integration in `CreatePostFlow`; `onPublishAction` remains an optional
  shell-level override for tests/stories.

**Используй экшены:**

- Навигация: `goToStep`, `goBack`, `goNext`, `reset`.
- Обновление состояния: `addImages`, `removeImage`, `setActiveImage`, `setCaption`.
- Состояние редактирования изображений: `setImageAspectRatio`, `setImageFilter`, `setImageExported`.
- Пайплайн публикации: `applyUploadBatchState`, `setPublishing`.

**Используй селекторы:**

- UI-логика: `selectHasCreatePostUnsavedData`, `selectImagesCount`, `selectHasImages`, `selectActiveImage`, `selectCanGoNext`, `selectCanPublish`.
- Будущий пайплайн загрузки: `selectIsReadyForUpload`, `selectUploadCandidates`, `selectReadyFileIds`, `selectAreAllUploadsReady`.

**Читай:**

- Полный `CreatePostState` в `CreatePostFlow` и интеграцию с сервисом загрузки.
- Порядок `state.images` при формировании финального `fileIds` для `createPost`.

**Не меняй:**

- Структуру состояния без синхронизации с `08-frontend-contracts.md`.
- Компоненты шагов так, чтобы они напрямую работали с редьюсером/dispatch/бэкендом.
- Семантику `CreatePostImage.id`.

**Типичные ошибки:**

- Добавление отдельного поля `clientUploadId`.
- Разрешение публикации до `selectCanPublish`.
- Использование устаревшего `exported` или `upload` после изменения пропорций/фильтров.

**Готовые контракты:**

- Компоненты шагов получают только пропсы и колбэки.
- `onPublishAction(state)` — optional shell override; default production publish path uses
  `uploadCreatePostImages` and `createPost`.

---

## Разработчик 2 — Владелец загрузки

**Отвечает за:**

- Поле выбора файлов, кнопку "Добавить фото", drag/drop, валидацию и превью через object URL.
- Создание начальных объектов `CreatePostImage` для выбранных файлов.
- UI-статусы загрузки, когда сервис публикации позже запишет статус.

**Используй колбэки:**

- `onAddImages(images)` — добавить подготовленные изображения.
- `onRemoveImage(imageId)` — удалить по `image.id`.
- `onSetActiveImage(imageId)` — выбрать активное изображение.

**Используй селекторы:**

- Обычно не нужны внутри `UploadStep`; `CreatePostFlow` передаёт `images` и `activeImageId`.
- Для работы на уровне модели используй `selectImagesCount`, `selectHasImages`, `selectActiveImage`.

**Читай:**

- `images`, `activeImageId`.
- `image.file`, `image.fileInfo`, `image.previewUrl`, `image.upload?.status`.

**Не меняй:**

- Поля кадрирования/фильтров/экспорта напрямую.
- `upload.fileId`, `upload.uploadUrl`, `upload.status` из UI-событий.
- Редьюсер, dispatch, бэкенд-вызовы или сервис загрузки из `UploadStep`.

**Типичные ошибки:**

- Использование индекса массива как идентификатора изображения.
- Показ `uploadUrl` как превью изображения.
- Забывание, что `previewUrl` — это локальное браузерное превью, а не бэкендовый URL для отображения.

**Готовые контракты:**

- Разрешённые типы: `image/jpeg`, `image/png`.
- GraphQL enum mapping: `image/jpeg` -> `MimeType.JPEG`, `image/png` -> `MimeType.PNG`.
- Лимиты: 1–10 изображений, 20 МБ на каждое.
- `image.id` генерируется здесь и должен быть стабильным и уникальным для всего create-потока.

---

## Разработчик 3 — Владелец кадрирования, фильтров и экспорта

**Отвечает за:**

- UI кадрирования, UI фильтров, работу с canvas/обработку изображений и финальный экспорт.
- Создание `image.exported.file` с соответствующими `fileInfo` и `objectUrl`.

**Используй колбэки:**

- `onAspectRatioChange(imageId, aspectRatio)`.
- `onFilterChange(imageId, filter)`.
- `onImageExported(imageId, exported)`.

**Используй селекторы:**

- Обычно не нужны внутри компонентов шагов; `CreatePostFlow` передаёт `activeImage`.
- Для работы на уровне модели используй `selectActiveImage`, `selectHasAllImagesExported`, `selectIsReadyForUpload`.

**Читай:**

- `activeImage.file` или `activeImage.previewUrl` как источник для редактирования.
- `activeImage.aspectRatio`, `activeImage.filter`, `activeImage.exported`.

**Не меняй:**

- Состояние загрузки из компонентов кадрирования/фильтров.
- Описание (caption), состояние публикации, бэкенд API или загрузку в хранилище.
- `image.id`.

**Типичные ошибки:**

- Загрузка или подготовка бэкендовых данных из компонентов кадрирования/фильтров.
- Использование оригинального `image.file` как финального файла для загрузки после редактирования.
- Оставление старого `exported.file` после изменения пропорций/фильтров.

**Готовые контракты:**

- Финальный источник для загрузки — `image.exported.file`.
- Изменение пропорций или фильтра очищает устаревшие `exported` и `upload` через экшены редьюсера.

---

## Разработчик 4 — Владелец UI постов

**Отвечает за:**

- `PostCard`, `PostGrid`, `PostDetails`, UI постов в профиле, состояния загрузки и пустые состояния.
- Отображение вложений постов, приходящих от бэкенда.

**Используй экшены:**

- Никакие из редьюсера `create-post` не используются.

**Используй селекторы:**

- Никакие из `create-post` не используются; UI постов читает данные из бэкенд-запросов.

**Читай:**

- `PostAttachmentEntity.fileId`, `PostAttachmentEntity.sortOrder`, `PostAttachmentEntity.file.url`.
- `profilePosts(input: { userId, first, after? })` когда GraphQL-операции будут доступны.

**Не меняй:**

- Локальное состояние Create Post.
- Состояние пайплайна загрузки.
- Контракт URL отображения вложений.

**Типичные ошибки:**

- Рендеринг `attachment.url`, `post.imageUrl` или `uploadUrl`.
- Зависимость от локальных object URL после создания поста.
- Предположение о пагинации со смещением (offset) для `profilePosts`.

**Готовые контракты:**

- Отображай изображения через `attachment.file.url`.
- `profilePosts` использует курсорную пагинацию: `first`, опциональный `after`; размер страницы — 8.

---

## Разработчик 5 — Владелец фильтров и canvas export

**Отвечает за:**

- Filters step.
- Canvas export после filters.
- `exported.objectUrl` lifecycle.

**Используй колбэки:**

- `onFilterChange(imageId, filter)`.
- `onImageExported(imageId, exported)`.

**Читай:**

- `activeImage`.
- `activeImage.exported`.
- `activeImage.filter`.

**Не меняй:**

- Create flow state без Dev 1.
- Upload ownership Dev 2.
- Crop ownership Dev 3.
- Posts UI ownership Dev 4.
- Gateway/API integration ownership Dev 1.

**Готовые контракты:**

- Final upload source is `image.exported.file`.
- `exported.objectUrl` must be revoked when replaced, reset or unmounted.
- Exported file MIME must map to backend `MimeType.JPEG` or `MimeType.PNG`.

---

## Контракты интеграции с бэкендом

- `initiateUploadBatch` принимает массив `InitiateUploadInput`: `clientUploadId`,
  `originalName`, `purpose`, `mimeType`, `size`.
- Для posts всегда передавать `purpose: POST_IMAGE`.
- `MimeType`: `JPEG | PNG`.
- `FileStatus`: `PENDING | UPLOADED | READY | FAILED | DELETED`.
- `initiateUploadBatch` возвращает: `clientUploadId`, `fileId`, `uploadUrl`, `expiresAt`.
- Загрузка в хранилище — прямой `PUT`-запрос на `uploadUrl` с экспортированным файлом.
- `completeUpload` получает массив `{ fileId }` и возвращает `fileId` plus `FileStatus`.
- `createPost` получает упорядоченные `fileIds` и опциональное `description` (до 500 символов).
- `updatePostDescription` получает `postId` and `description`.
- `deletePost` получает `postId`.
- `profilePosts` получает `userId`, `first` and optional `after`.
- `feed` returns `[PostEntity!]!`.
- `post(id: String!)` returns `PostEntity` or `null`.
- GraphQL-схема и create-post обёртки операций присутствуют в продакшен-коде.
