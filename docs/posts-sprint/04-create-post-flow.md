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

Target backend pipeline after contract:

```txt
final edited File -> request presigned URL -> PUT to storage -> save metadata through GraphQL -> createPost
```

GraphQL Upload is not used for post media.

## Step: upload

Responsibilities:

- выбрать изображения;
- проверить basic frontend validation;
- создать object URLs для preview;
- сохранить original files and metadata in state;
- позволить удалить выбранный файл;
- перейти к crop только если есть валидные files.

На текущем этапе upload остается frontend-only. Backend upload API не подключается, real presigned
upload helpers не добавляются.

## Step: crop

Responsibilities:

- показать выбранное изображение в `react-advanced-cropper`;
- управлять crop area, zoom и aspect ratio;
- поддержать aspect ratio modes из Figma: `original`, `1:1`, `4:5`, `16:9`;
- поддержать active image navigation and media strip для multi-image posts;
- сохранить crop settings per image;
- подготовить данные для final export;
- перейти к filters после валидного crop state.

## Step: filters

Responsibilities:

- показать preview с выбранными фильтрами;
- использовать Figma layout: preview слева, filters grid справа на desktop;
- хранить filter settings per image;
- не менять original file;
- подготовить image processing pipeline для export.

## Step: publication

Responsibilities:

- показать final preview;
- собрать caption/hashtags UI;
- валидировать обязательные frontend поля;
- показать disabled publish state, если backend contract еще не подключен;
- позже вызвать upload/createPost integration.
- не использовать GraphQL Upload.

## Step: publish

Responsibilities after backend contract:

- экспортировать final images;
- запросить presigned URL для каждого final edited `File`;
- загрузить final files напрямую в storage через `PUT`;
- сохранить uploaded file metadata через GraphQL mutation;
- вызвать `createPost` with saved media metadata references;
- обработать success and errors;
- закрыть modal or navigate to created post/profile according to product decision.

До backend contract publish остается skeleton boundary.

## In-memory flow state shape

Ориентировочная frontend state shape. Это не backend contract и не product draft persistence.
Product draft отложен на конец спринта.

State ownership:

- Dev 1 is Create Flow Owner and owns `CreatePostState`, `CreatePostImage` and `CreatePostStep`.
- Dev 2 and Dev 3 do not change shared state contract independently.
- Upload/crop/filter PRs can add local component state, but shared state shape changes require Dev 1
  agreement.

```ts
type CreatePostStep = 'upload' | 'crop' | 'filters' | 'publication'

type CreatePostImageDraft = {
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
  filter: 'normal' | 'clarendon' | 'lark' | 'gingham' | 'moon'
  exported?: {
    file: File
    objectUrl: string
    fileInfo: {
      name: string
      size: number
      type: string
      lastModified: number
    }
  }
  upload?: {
    status:
      | 'idle'
      | 'requesting-presigned-url'
      | 'uploading-to-storage'
      | 'saving-metadata'
      | 'uploaded'
      | 'failed'
    error?: string
  }
}

type CreatePostDraft = {
  step: CreatePostStep
  images: CreatePostImageDraft[]
  activeImageId: string | null
  caption: string
  hasUnsavedData: boolean
  isPublishing: boolean
}
```

Implementation note: replace `unknown` coordinates with the exact cropper type when
`react-advanced-cropper` is installed. Do not use `any`.

## Step transitions

- `upload -> crop`: allowed when at least one valid image exists.
- `crop -> filters`: allowed when active image crop state is valid.
- `filters -> publication`: allowed after filters are selected or explicitly skipped.
- `publication -> publish`: allowed only when final exported images exist. Backend integration is
  still not connected.
- Back navigation between steps should preserve selected files and settings.
- Reset clears in-memory create state. Object URL revoke logic belongs to the upload/export
  implementation work.

## Unsaved data logic

`hasUnsavedData` should become `true` when any of these are true:

- at least one file was selected;
- crop settings changed;
- filter settings changed;
- caption is not empty;
- final exported image exists.

## Close Behavior

Current close behavior:

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
- For exported blobs, create separate object URLs and revoke them when replaced/reset/unmounted.
- Never create object URLs inside render.

## Final image export logic

Frontend exports final images after crop/filter:

- read original image;
- apply crop coordinates;
- apply selected filter settings;
- render into canvas;
- export to Blob/File using agreed format and quality;
- store exported File in draft state;
- send exported File to storage through presigned URL after backend contract is available.

Open backend questions:

- output format;
- quality/compression;
- max width/height;
- max file size;
- whether backend needs crop/filter metadata for audit/debug.

## Backend connection point

Backend integration should be added only after contract exists:

- request presigned URL for final edited files;
- `PUT` final edited files directly to storage;
- save uploaded file metadata through GraphQL;
- call `createPost` with saved media metadata references;
- update profile/feed/main caches according to agreed API/cache strategy.

Do not add GraphQL Upload, real presigned upload API helpers or fake GraphQL operations before the
backend contract is ready.

## Current skeleton behavior

Current frontend skeleton may show the steps and placeholder preview, but must not:

- call backend;
- create fake GraphQL operations;
- persist draft;
- claim upload/crop/filter is production-ready;
- add dependencies outside dedicated dependency PRs.

## Mobile behavior

Desktop behavior is confirmed as a route-based modal over `(main)`. Mobile behavior is not confirmed.
The likely direction is a fullscreen wizard, but it needs a separate product/design decision before
implementation.
