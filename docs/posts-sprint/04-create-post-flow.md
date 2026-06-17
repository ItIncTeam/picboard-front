# Create Post Flow

Create Post должен работать в двух shell:

- route-based modal: `app/(protected)/(main)/@modal/(.)posts/create/page.tsx`;
- fallback page: `app/(protected)/(main)/posts/create/page.tsx`.

Оба shell должны использовать один и тот же `CreatePostFlow` из `features/create-post`.

Figma review for this flow: [Create Post Figma Review](./06-figma-review.md).

## Flow

```txt
upload -> crop -> filters -> publication -> publish
```

## Step: upload

Responsibilities:

- выбрать изображения;
- проверить basic frontend validation;
- создать object URLs для preview;
- сохранить original files and metadata in state;
- позволить удалить выбранный файл;
- перейти к crop только если есть валидные files.

На текущем этапе upload остается frontend-only. Backend upload API не подключается.

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

## Step: publish

Responsibilities after backend contract:

- экспортировать final images;
- отправить final images по согласованному upload contract;
- вызвать `createPost` с media references and metadata;
- обработать success and errors;
- закрыть modal or navigate to created post/profile according to product decision.

До backend contract publish остается skeleton boundary.

## In-memory flow state shape

Ориентировочная frontend state shape. Это не backend contract и не product draft persistence.
Product draft отложен на конец спринта.

State ownership:

- Dev 1 owns `CreatePostState`, `CreatePostImage` and `CreatePostStep`.
- Dev 2 and Dev 3 do not change shared state contract independently.
- Upload/crop/filter PRs can add local component state, but shared state shape changes require Dev 1
  agreement.

```ts
type CreatePostStep = 'upload' | 'crop' | 'filters' | 'publication'

type CreatePostImageDraft = {
  id: string
  file: File
  objectUrl: string
  crop?: {
    aspectRatio: 'original' | '1:1' | '4:5' | '16:9'
    coordinates: unknown
    zoom: number
  }
  filter?: {
    name: 'none' | string
    intensity: number
  }
  exported?: {
    file: File
    objectUrl: string
  }
}

type CreatePostDraft = {
  step: CreatePostStep
  images: CreatePostImageDraft[]
  activeImageId: string | null
  caption: string
  tags: string[]
  isPublishing: boolean
  error: string | null
}
```

Implementation note: replace `unknown` coordinates with the exact cropper type when
`react-advanced-cropper` is installed. Do not use `any`.

## Step transitions

- `upload -> crop`: allowed when at least one valid image exists.
- `crop -> filters`: allowed when active image crop state is valid.
- `filters -> publication`: allowed after filters are selected or explicitly skipped.
- `publication -> publish`: allowed when publication fields are valid and backend integration is
  available.
- Back navigation between steps should preserve selected files and settings.
- Reset clears state and revokes object URLs.

## Unsaved data logic

`hasUnsavedData` should become `true` when any of these are true:

- at least one file was selected;
- crop settings changed;
- filter settings changed;
- caption is not empty;
- tags are not empty;
- final exported image exists.

Close behavior:

- if `hasUnsavedData === false`: close immediately via `router.back()` with `/main` fallback;
- if `hasUnsavedData === true`: show confirm dialog;
- if user confirms: cleanup object URLs, reset state, close;
- if user cancels: stay in flow.

Confirm is not part of the first skeleton. It becomes required only after unsaved data exists.

Until product draft persistence is designed, confirmation actions should be `Discard` and
`Keep editing`. Do not implement or display `Save draft` from Figma in early PRs.

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
- send exported File to backend after upload contract is available.

Open backend questions:

- output format;
- quality/compression;
- max width/height;
- max file size;
- whether backend needs crop/filter metadata for audit/debug.

## Backend connection point

Backend integration should be added only after contract exists:

- upload final image files;
- receive media/file IDs or URLs;
- call `createPost`;
- update profile/feed/main caches according to agreed API/cache strategy.

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
