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

Changed by: future backend integration PR after Dev 1 approval

Purpose: publish submission state. Current production code does not run the backend upload pipeline.

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

Changed by: Dev 3 through an agreed state update

Purpose: per-image crop aspect ratio. Supported values are `original`, `1:1`, `4:5`, `16:9`.

### `filter`

Owner: Dev 3

Used by: Filters, export pipeline

Changed by: Dev 3 through an agreed state update

Purpose: per-image filter preset. Current planned presets are `normal`, `clarendon`, `lark`,
`gingham`, `moon`.

### `exported`

Owner: Dev 3

Consumed by: Upload Pipeline, Publication, selectors

Changed by: Dev 3 through an agreed state update

Purpose: final edited artifact after crop/filter processing. Upload pipeline starts from
`image.exported.file`.

### `exported.file`

Owner: Dev 3

Consumed by: Upload Pipeline

Changed by: Dev 3 during export

Purpose: final `File` sent to storage through `initiateUploadBatch`, storage `PUT`,
`completeUploadBatch` and `createPost`.

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

Changed by: future backend integration PR after Dev 1 approval

Purpose: planned upload state. Current production code defines the field, but the backend upload
pipeline is not implemented. Do not duplicate upload state outside the shared flow contract, and do
not duplicate `CreatePostImage.id` as `clientUploadId`.

### `upload.fileId`

Owner: Dev 1

Used by: Backend integration

Changed by: future backend integration PR after Dev 1 approval

Purpose: backend file id returned by `initiateUploadBatch` and later passed through
`completeUploadBatch` / `createPost` after the upload is ready.

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

Использовать ожидаемый контракт:

```txt
attachment.file.url
```

Пока считать его expected backend update.

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
completeUploadBatch
↓
READY
↓
createPost
```

READY status comes from completeUploadBatch, not from successful storage PUT.

Не обходить этапы.

Не вызывать `createPost` до `READY`.

Pipeline rules:

- build `initiateUploadBatch` input from exported files;
- map backend descriptors by `clientUploadId`;
- upload binaries directly to storage with `PUT`;
- treat HTTP `2xx` as successful storage upload;
- call `completeUploadBatch` with `fileIds`;
- attach only `READY` files to `createPost`.

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
