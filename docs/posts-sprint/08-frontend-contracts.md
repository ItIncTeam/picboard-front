# Frontend Contracts

Этот документ описывает shared contracts Posts Sprint.

Все изменения `CreatePostState` должны согласовываться через Create Flow Owner (Dev 1).

---

## CreatePostState Ownership

Owner:

Dev 1

Причина:

`CreatePostState` используется одновременно:

- Upload;
- Crop;
- Filters;
- Publication;
- Backend integration.

Изменение state влияет на нескольких разработчиков.

Не изменять state shape без согласования.

Current source of truth in code:

- `src/features/create-post/model/createPostTypes.ts`;
- `src/features/create-post/model/createPostReducer.ts`;
- `src/features/create-post/model/createPostSelectors.ts`.

## CreatePostState Contract

Current state shape:

```ts
type CreatePostState = {
  step: CreatePostStep
  images: CreatePostImage[]
  activeImageId: string | null
  caption: string
  hasUnsavedData: boolean
  isPublishing: boolean
}
```

### `step`

Owner: Dev 1

Used by: Create flow shell, Upload, Crop, Filters, Publication

Changed by: Dev 1 through reducer transitions only

Purpose: controls current wizard step: `upload`, `crop`, `filters`, `publication`.

### `images`

Owner: Dev 1

Used by: Dev 2, Dev 3, Publication, Backend integration

Changed by: Dev 1 reducer actions. Dev 2 and Dev 3 may provide image payloads only through agreed
actions or an approved state change.

Purpose: ordered list of images in the create flow. Do not use array index as backend identity.

### `activeImageId`

Owner: Dev 1

Used by: Crop, Filters

Changed by: Dev 1 reducer actions

Purpose: points to the active image by `CreatePostImage.id`.

### `caption`

Owner: Dev 1

Used by: Publication, Backend integration

Changed by: Publication through agreed reducer action

Purpose: frontend caption text. Backend `createPost.description` is optional and limited to 500
characters.

### `hasUnsavedData`

Owner: Dev 1

Used by: Create flow shell, Close Confirm, modal close behavior

Changed by: Dev 1 reducer actions

Purpose: controls whether closing Create Post shows confirmation.

### `isPublishing`

Owner: Dev 1

Used by: Publication, Backend integration

Changed by: `CreatePostFlow` during the default publish pipeline

Purpose: publish submission state while upload service and `createPost` are running.

## Step Boundary Contract

Owner:

Dev 1

Purpose:

`CreatePostFlow` is the integration shell. It owns reducer, state, selectors and navigation. Step
components receive data and callbacks only.

Rules:

- Step components must not import `createPostReducer`.
- Step components must not receive or call `dispatch`.
- Step components must not call backend, Apollo, GraphQL operations or upload service.
- Step components must not use `uploadUrl` for display.
- Default publish integration is owned by `CreatePostFlow`; `onPublishAction` is an optional
  shell-level override for tests/stories.
- Upload descriptors, upload patches and ready file ids must be matched by `CreatePostImage.id`
  / backend `clientUploadId`, never by array index.

Implemented props:

```ts
type UploadStepProps = {
  images: CreatePostImage[]
  activeImageId: string | null
  onAddImages: (images: CreatePostImage[]) => void
  onRemoveImage: (imageId: string) => void
  onSetActiveImage: (imageId: string | null) => void
}

type CropStepProps = {
  activeImage: CreatePostImage | null
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

type FiltersStepProps = {
  activeImage: CreatePostImage | null
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
}

type PublicationStepProps = {
  images: CreatePostImage[]
  caption: string
  onCaptionChange: (caption: string) => void
}
```

`onAspectRatioChange` and `onFilterChange` update existing per-image state fields and clear stale
`exported` / `upload` state. This prevents publish integration from reusing a file id or temporary
upload URL that belongs to an older edited file.

## CreatePostImage Contract

Current image shape:

```ts
type CreatePostImage = {
  id: string
  name: string
  file?: File
  fileInfo?: CreatePostImageFileInfo
  previewUrl?: string
  aspectRatio: AspectRatio
  filter: ImageFilter
  exported?: {
    file: File
    objectUrl: string
    fileInfo: CreatePostImageFileInfo
  }
  upload?: {
    fileId?: string
    uploadUrl?: string
    expiresAt?: string
    status: CreatePostUploadStatus
    error?: string
  }
}
```

### `id`

Owner: Dev 1

Used by: Dev 2, Dev 3, Backend integration

Changed by: Dev 2 during image creation only through the agreed `addImages` payload

Purpose: frontend image identity. `CreatePostImage.id` is used as `clientUploadId` for the backend
upload flow. Do not add a second `clientUploadId` field to `CreatePostImage` or `upload`.

Creation: new upload images use `crypto.randomUUID()` through the create-post feature helper.

Upload response mapping must use this value. Do not map upload responses by array index.

### `name`

Owner: Dev 2

Used by: Upload UI, Backend integration

Changed by: Dev 2 during image creation

Purpose: display/original name for selected image.

### `file`

Owner: Dev 2

Used by: Upload validation, Crop, Filters

Changed by: Dev 2 during image creation

Purpose: original selected file. Backend upload must use `image.exported.file`, not this original
file, after crop/filter export exists.

### `fileInfo`

Owner: Dev 2

Used by: Upload UI, validation, debugging, future backend integration input mapping

Changed by: Dev 2 during image creation

Purpose: serializable metadata for the original file: name, size, type and lastModified.

### `previewUrl`

Owner: Dev 2

Used by: Upload preview, Crop, Filters

Changed by: Dev 2 during object URL lifecycle

Purpose: local preview URL for the original selected image. Must be revoked on remove, reset and
unmount.

### `aspectRatio`

Owner: Dev 3

Used by: Crop, export pipeline

Changed by: Dev 3 through `CropStepProps.onAspectRatioChange`

Purpose: per-image crop aspect ratio. Supported values are `original`, `1:1`, `4:5`, `16:9`.

### `filter`

Owner: Dev 3

Used by: Filters, export pipeline

Changed by: Dev 3 through `FiltersStepProps.onFilterChange`

Purpose: per-image filter preset. Current presets are `normal`, `clarendon`, `lark`, `gingham`,
`moon`.

### `exported`

Owner: Dev 3

Consumed by: Upload Pipeline, Publication, selectors

Changed by: Dev 3 through `CropStepProps.onImageExported` or
`FiltersStepProps.onImageExported`

Purpose: final edited artifact after crop/filter processing. Upload pipeline starts from
`image.exported.file`.

### `exported.file`

Owner: Dev 3

Consumed by: Upload Pipeline

Changed by: Dev 3 during export

Purpose: final `File` sent to storage through `initiateUploadBatch`, storage `PUT`,
`completeUpload` and `createPost`.

### `exported.objectUrl`

Owner: Dev 3

Consumed by: Publication preview

Changed by: Dev 3 during export

Purpose: local preview URL for exported image. Must be revoked when replaced, reset or unmounted.

### `exported.fileInfo`

Owner: Dev 3

Consumed by: Upload Pipeline

Changed by: Dev 3 during export

Purpose: serializable metadata for the exported file.

### `upload`

Owner: Dev 1

Used by: Dev 2 upload status UI, Backend integration

Changed by: upload service through `applyUploadBatchState`

Purpose: upload pipeline state. Do not duplicate upload state outside the shared flow contract, and
do not duplicate `CreatePostImage.id` as `clientUploadId`.

### `upload.fileId`

Owner: Dev 1

Used by: Backend integration

Changed by: upload service through `applyUploadBatchState`

Purpose: backend file id returned by `initiateUploadBatch` and later passed through
`completeUpload` / `createPost` after the upload is ready. `completeUpload` input is an array of
`{ fileId }` items.

### `upload.uploadUrl`

Owner: Dev 1

Used by: Backend integration

Changed by: future backend integration PR after Dev 1 approval

Purpose: temporary write URL returned by `initiateUploadBatch` for storage `PUT`. It must never be
used as a display URL.

### `upload.expiresAt`

Owner: Dev 1

Used by: Backend integration

Changed by: future backend integration PR after Dev 1 approval

Purpose: expiration timestamp for the temporary `uploadUrl`.

### `upload.status`

Owner: Dev 1

Used by: Dev 2 upload status UI, Backend integration

Changed by: future backend integration PR after Dev 1 approval

Purpose: current type allows `idle`, `uploading`, `uploaded`, `failed`, `ready`.

### `upload.error`

Owner: Dev 1

Used by: Dev 2 upload status UI, Backend integration

Changed by: future backend integration PR after Dev 1 approval

Purpose: frontend error text or code for failed upload states.

## Dev 2 Contract

Upload Owner

Разрешено:

- file input;
- validation;
- drag and drop;
- object URLs;
- `CreatePostImage.id` generation, used as `clientUploadId`;
- upload status UI.

Запрещено:

- GraphQL integration;
- `createPost` mutation;
- crop logic;
- filters logic;
- изменение `CreatePostState` без согласования.

Важно:

Не использовать индекс массива для сопоставления файлов.

Всегда использовать `CreatePostImage.id`. Backend treats it as `clientUploadId`.

Frontend mapping:

- `CreatePostImage.id` is the `clientUploadId`;
- `image.exported.file` is the file uploaded in the backend pipeline;
- post uploads use `purpose: POST_IMAGE`;
- browser `image/jpeg` maps to `MimeType.JPEG`;
- browser `image/png` maps to `MimeType.PNG`;
- `uploadUrl` must never be used as an image display URL.

## Dev 3 Contract

Crop / Filters / Export Owner

Разрешено:

- cropper;
- filters;
- canvas processing;
- export pipeline.

Результат работы:

`image.exported.file`

Важно:

Upload начинается только после получения `exported.file`.

Не заниматься backend integration.

Не создавать upload state.

Dev 3 may update crop/filter/export fields only through an agreed shared state change with Dev 1.

## Dev 4 Contract

Posts UI Owner

Разрешено:

- `PostCard`;
- `PostGrid`;
- `PostDetails` UI;
- `ProfilePosts` UI;
- Skeletons;
- Empty states.

Важно:

Не предполагать структуру image URL.

Использовать backend-confirmed display URL contract:

```txt
attachment.file.url
```

Do not use:

- `uploadUrl`;
- `attachment.url`;
- array index as attachment identity.

## Upload Pipeline Contract

Будущий flow:

```txt
select files
↓
exported.file
↓
initiateUploadBatch
↓
PUT upload
↓
completeUpload
↓
READY
↓
createPost
```

READY status comes from completeUpload, not from successful storage PUT.

Не обходить этапы.

Не вызывать `createPost` до `READY`.

Pipeline rules:

- build `initiateUploadBatch` input from exported files;
- map backend descriptors by `clientUploadId`;
- upload binaries directly to storage with `PUT`;
- treat HTTP `2xx` as successful storage upload;
- call `completeUpload` with `CompleteUploadInput[]`, one `{ fileId }` item per uploaded file;
- attach only `READY` files to `createPost`.

Selector rules:

- exported readiness is not backend `READY`;
- backend `READY` is represented by `upload.status === 'ready'`;
- use `selectHasAllImagesExported` for starting the upload pipeline;
- use `selectAreAllUploadsReady` before `createPost`.

## Common Mistakes

Не использовать index для связи файлов.

Do not use `CreatePostImage.id` and array index interchangeably. Image order and upload identity are
different concepts.

Не хранить `uploadUrl` как display URL.

Не использовать `uploadUrl` внутри `PostCard`.

Не расширять `CreatePostState` без согласования.

Не дублировать upload state в нескольких местах.

Не отправлять original `image.file` вместо `image.exported.file`, когда export уже должен быть
готов.

Не добавлять GraphQL Upload.

## Change Process

Если нужен новый field в `CreatePostState`:

1. Создать proposal.
2. Обсудить с Dev 1.
3. Обновить documentation.
4. Только потом менять reducer/selectors/state.

Proposal should include:

- field name and type;
- owner;
- readers;
- writers;
- reducer/selectors impact;
- object URL cleanup impact, if the field stores local URLs;
- backend contract mapping, if the field leaves frontend-only state.
