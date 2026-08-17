# Create Post Flow

Create Post должен работать в двух shell:

- route-based modal: `app/(protected)/(main)/@modal/(.)posts/create/page.tsx`;
- fallback page: `app/(protected)/(main)/posts/create/page.tsx`.

Оба shell должны использовать один и тот же `CreatePostFlow` из `features/create-post`.

Figma review for this flow: [Create Post Figma Review](./06-figma-review.md).

## Flow

```txt
Upload
↓
Crop
↓
Filters
↓
Publication
```

Backend-confirmed target pipeline:

```txt
exported File -> initiateUploadBatch -> direct storage PUT -> completeUpload -> createPost
```

GraphQL Upload is not used for post media.

Gateway endpoint:

- production: `https://gateway.picboard.space/api/v1`;
- local: `http://localhost:3000/api/v1`.

## Step: upload

Responsibilities:

- выбрать изображения;
- проверить basic frontend validation;
- создать object URLs для preview;
- сохранить original files and metadata in state;
- позволить удалить выбранный файл;
- перейти к crop только если есть валидные files.

Confirmed backend validation mirrored on frontend:

- allowed MIME types: `image/jpeg`, `image/png`;
- minimum images per post: `1`;
- maximum images per post: `10`;
- maximum file size: `20 MB`.

На текущем этапе upload остается frontend-only. Backend upload API не подключается, real upload
helpers не добавляются.

## Step: crop

Responsibilities:

- показать выбранное изображение в `react-advanced-cropper`;
- управлять crop area и aspect ratio; zoom остается отдельным follow-up до подтверждения product
  semantics;
- поддержать aspect ratio modes из Figma: `original`, `1:1`, `4:5`, `16:9`;
- поддержать active image navigation and media strip для multi-image posts;
- ограничивать image navigation границами массива: первая image не показывает Previous, последняя
  не показывает Next;
- хранить aspect ratio и минимальную crop geometry (`coordinates`, `visibleArea`, `transforms`)
  per image; viewport-dependent `boundary` / `imageSize` в state не сохраняются;
- экспортировать текущий canvas в новый `File`, не изменяя original `file` / `previewUrl`;
- сохранить immutable crop result в `image.cropped` по стабильному `image.id`, а для `normal`
  filter также использовать его как текущий final `image.exported`;
- последовательно обработать images в порядке state и перейти к filters только после успешного
  crop export всех images.

## Step: filters

Responsibilities:

- показать preview с выбранными фильтрами;
- использовать Figma layout: preview слева, filters grid справа на desktop;
- хранить filter settings per image;
- всегда читать immutable base из `image.cropped.file`, не меняя cropped/original artifacts;
- для `normal` переиспользовать cropped artifact, а для остальных presets записывать новый Canvas
  export в финальный `image.exported`.

## Step: publication

Responsibilities:

- показать final preview только из `image.exported.objectUrl`; если export еще не готов, показать
  placeholder вместо `previewUrl`;
- собрать caption/hashtags UI;
- валидировать description max length: `500` characters;
- show disabled publish state when `selectCanPublish` is false;
- disable caption editing while `isPublishing` so the visible description stays equal to the
  publish snapshot;
- call the default publish pipeline when publish is allowed, unless `onPublishAction` is provided
  as a shell-level override for tests/stories.
- не использовать GraphQL Upload.

## Step: publish

Current default publish pipeline:

- collect `image.exported.file` for every selected image;
- build `initiateUploadBatch` input from `image.exported.fileInfo`;
- call `initiateUploadBatch`;
- map upload descriptors by `clientUploadId`, which is `CreatePostImage.id`;
- upload every `image.exported.file` directly to storage via `PUT`;
- call `completeUpload`;
- verify every selected file is `READY`;
- call `createPost` with `fileIds` and optional description;
- обработать success and errors through publishing/error state;
- reset the Create Post state and close/navigate through the current modal/page shell.

`onPublishAction` remains an optional override for tests/stories. Production UI should use the
default `CreatePostFlow` publish path.

## In-memory flow state shape

Current frontend state shape is frontend-only. Это не backend contract и не product draft
persistence.
Product draft отложен на конец спринта.

State ownership:

- Dev 1 is Create Flow Owner and owns `CreatePostState`, `CreatePostImage` and `CreatePostStep`.
- Dev 2 and Dev 3 do not change shared state contract independently.
- Upload/crop/filter PRs can add local component state, but shared state shape changes require Dev 1
  agreement.

```ts
type CreatePostStep = 'upload' | 'crop' | 'filters' | 'publication'

type CreatePostImage = {
  id: string
  name: string
  file?: File
  fileInfo?: {
    name: string
    size: number
    type: string
    lastModified: number
  }
  previewUrl?: string
  aspectRatio: 'original' | '1:1' | '4:5' | '16:9'
  cropGeometry?: CreatePostCropGeometry
  cropped?: CreatePostImageArtifact
  filter: 'normal' | 'clarendon' | 'lark' | 'gingham' | 'moon'
  exported?: CreatePostImageArtifact
  upload?: {
    fileId?: string
    uploadUrl?: string
    expiresAt?: string
    status: 'idle' | 'uploading' | 'uploaded' | 'failed' | 'ready'
    error?: string
  }
}

type CreatePostState = {
  step: CreatePostStep
  images: CreatePostImage[]
  activeImageId: string | null
  caption: string
  hasUnsavedData: boolean
  isPublishing: boolean
}
```

Backend integration target mapping:

- `CreatePostImage.id` maps to backend `clientUploadId`;
- `CreatePostImage.exported.file` is used as the uploaded file;
- posts use `purpose: POST_IMAGE`;
- `image/jpeg` maps to `MimeType.JPEG`;
- `image/png` maps to `MimeType.PNG`;
- `description` comes from `caption` and must be optional with a 500-character maximum.

## Step integration boundaries

Current implementation:

- `CreatePostFlow` owns `useReducer`, `CreatePostState`, selectors and step navigation.
- Step components receive only data props and callback props.
- Step components do not import the reducer, do not receive `dispatch`, and do not know about
  backend, Apollo, GraphQL operations or upload service.
- default publish integration lives in `CreatePostFlow` and uses the feature-local upload service
  plus `createPost`; `onPublishAction` remains an optional shell-level override.

Implemented step props:

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
  images: CreatePostImage[]
  disabled?: boolean
  exportRef?: Ref<CropStepHandle>
  onSetActiveImage: (imageId: string | null) => void
  onAspectRatioChange: (imageId: string, aspectRatio: AspectRatio) => void
  onCropGeometryChange: (imageId: string, geometry: CreatePostCropGeometry) => void
  onRemoveImage: (imageId: string) => void
  onAddImages: (images: CreatePostImage[]) => void
}

type CropStepHandle = {
  exportActiveImage: () => Promise<{
    imageId: string
    ratio: AspectRatio
    geometry: CreatePostCropGeometry
    cropped: NonNullable<CreatePostImage['cropped']>
  }>
}

type FiltersStepProps = {
  activeImage: CreatePostImage | null
  images: CreatePostImage[]
  onExportingChange: (isExporting: boolean) => void
  onFilterChange: (imageId: string, filter: ImageFilter) => void
  onImageExported: (imageId: string, exported: CreatePostImage['exported']) => void
  onRemoveImage: (imageId: string) => void
  onSetActiveImage: (imageId: string | null) => void
}

type PublicationStepProps = {
  images: CreatePostImage[]
  caption: string
  isPublishing: boolean
  onCaptionChange: (caption: string) => void
  onRetryUpload: () => void
}
```

`CropStep` owns the cropper ref and exposes only `exportActiveImage()` through its imperative handle.
`CreatePostFlow` awaits that result, updates the matching image through the reducer and owns
sequential image selection and step navigation. The former `onImageExported` callback is not the
Crop export API; it remains a Filters boundary callback.

`onAspectRatioChange` clears crop geometry, cropped base, final export and upload state.
`onCropGeometryChange` stores reducer-owned geometry by image id and clears cropped base, final
export and upload state only when that geometry actually changes. `onFilterChange` preserves the
immutable cropped base and clears only final `exported` / `upload` data.

`CropStep` restores reducer-owned coordinates, visible area and transforms after image switch,
remount and Filters -> Back. Artifact reuse compares that geometry plus aspect ratio. The dirty
contract excludes layout-dependent boundary and image-size fields, so resize does not invalidate
an unchanged crop.

## Step transitions

- `upload -> crop`: currently allowed when at least one image exists.
- `crop -> filters`: shell exports the active cropper canvas and stays on crop while an image without
  a current `cropped` base remains. The transition happens only after every image has `cropped`;
  current `normal` filter also exposes that artifact through final `exported`.
- `filters -> publication`: allowed only after every image has a current final `exported` artifact
  and no filter export is pending.
- `publication -> publish`: allowed when `selectCanPublish` is true: publication step, at least one
  image, all images exported, caption length up to 500, and `isPublishing === false`. Backend
  integration is connected through the default publish path; `onPublishAction` is only an override.
- Back navigation between steps should preserve selected files and settings.
- Reset clears in-memory create state. Original preview, cropped base and final exported object URLs
  are revoked by the shared create-post cleanup hook on replace, invalidation, remove, reset and
  unmount. Shared URLs are deduplicated. A stale async crop result revokes its newly-created object
  URL immediately.
- Object URL ownership is limited to one `CreatePostFlow` lifecycle. Final unmount revokes every
  remaining URL owned by that instance. A later flow mount must create new preview/exported URLs;
  reusing URLs from an unmounted flow is unsupported.

## Unsaved data logic

`hasUnsavedData` should become `true` when any of these are true:

- at least one file was selected;
- crop settings changed;
- filter settings changed;
- caption is not empty;
- final exported image exists.

## Close Behavior

Current close behavior:

- route-modal Escape, backdrop and direct dismiss requests call the same `CreatePostFlow` close
  guard as its explicit close action;
- if `hasUnsavedData === false`: close immediately through the shell `onCloseAction`;
- if `hasUnsavedData === true`: show Close Confirm;
- `Discard`: reset create state, then close modal;
- `Keep editing`: close confirm and stay in flow.

The current confirm is implemented in `CreatePostCloseConfirm`.

Until product draft persistence is designed, confirmation actions should be `Discard` and
`Keep editing`. Do not implement or display `Save draft` from Figma in early PRs.

## Navigation

Create navigation from Sidebar:

```txt
Sidebar
↓
/posts/create?returnTo=currentRoute
```

Create modal close:

```txt
close
↓
safe returnTo
```

The modal shell reads `returnTo`, validates it and calls `router.replace(safeReturnTo)`.

Navigation rules:

- missing or unsafe `returnTo` falls back to `/main`;
- `/auth` routes are forbidden as return targets;
- `/posts/create` and `/posts/create?...` are forbidden as return targets;
- external URLs and protocol-relative URLs are forbidden;
- direct `/posts/create` still renders the fallback page with the same `CreatePostFlow`.

## Object URL lifecycle

- Create object URL when a file is accepted into state.
- Store object URL with image draft item.
- Revoke object URL when image is removed.
- Revoke all object URLs when flow resets.
- Revoke all object URLs on unmount.
- For cropped and final exported blobs, track every distinct object URL and revoke it only after no
  current artifact references it.
- Never create object URLs inside render.

## Final image export logic

Frontend exports final images after crop/filter:

- read the immutable cropped base from `image.cropped.file`;
- apply selected filter settings;
- render into canvas;
- export to Blob/File using a backend-allowed image MIME type;
- store exported File in draft state;
- send exported File to storage through the backend-confirmed upload flow when the user publishes.

Open backend questions:

- whether frontend should preserve original JPEG/PNG format or normalize output;
- quality/compression;
- max width/height;
- whether backend needs crop/filter metadata for audit/debug.

## Backend connection point

Backend create integration is implemented in the current Create Post flow:

- collect exported files from `CreatePostImage.exported.file`;
- build `initiateUploadBatch` input with `clientUploadId`, `originalName`, `mimeType` and `size`;
- include `purpose: POST_IMAGE` in every `InitiateUploadInput`;
- map browser file types to `MimeType.JPEG` or `MimeType.PNG`;
- call `initiateUploadBatch`;
- map response descriptors by `clientUploadId`, not array order;
- `PUT` final edited files directly to storage with `Content-Type: file.type`;
- treat HTTP `2xx` storage response as successful binary upload;
- call `completeUpload` with uploaded files as `CompleteUploadInput[]`, one `{ fileId }` item per
  successfully uploaded file;
- call `createPost` only after every selected file is `READY`;
- after successful `createPost`, evict only `ROOT_QUERY.feed`, refetch the active Apollo `Feed`
  query and invalidate Public Home through fixed-path `revalidatePath('/')`;
- run Feed synchronization and Public Home invalidation as isolated background work that cannot
  turn an already successful create into a publish error;
- reset and close through the current modal/page shell after successful `createPost`.

Do not add GraphQL Upload, binary upload through GraphQL, order-based descriptor mapping, display
usage of `uploadUrl` for display or fake GraphQL operations.

Profile post synchronization remains separate follow-up work.

## Current implementation

Upload, crop, filters, publication and the default publish pipeline are implemented. Filters keep
the selected preset and final artifact per `image.id`, always process non-normal presets from the
immutable cropped base, reject stale async results and keep Publication navigation locked until all
final artifacts are ready.

## Known limitations

- Live verification of successful post-create synchronization is blocked while the backend
  `createPost` flow returns `Files service timeout`.
- Partial upload failure behavior is fail-fast. Backend/product still need to clarify whether
  previously uploaded files should be completed, retried or cleaned up.
- Retry/idempotency behavior for expired `uploadUrl`, failed storage `PUT`, failed
  `completeUpload` and failed `createPost` remains open.

## Mobile behavior

Desktop behavior is confirmed as a route-based modal over `(main)`. Mobile behavior is not confirmed.
The likely direction is a fullscreen wizard, but it needs a separate product/design decision before
implementation.

image.file
│
▼
image.cropped.file
│
▼
image.exported.file
│
▼
Upload Service
│
▼
Storage
│
▼
completeUpload
│
▼
createPost
