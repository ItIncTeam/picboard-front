# Create Post Upload Service

This document fixes the frontend service structure for the Create Post upload integration.
Backend operations and constraints are defined in [Posts Backend Contract](./07-backend-contract.md).
Shared frontend state and selector contracts are defined in
[Frontend Contracts](./08-frontend-contracts.md).

Production code contains create-post scoped GraphQL helpers, the feature-local upload service and
default publish integration. Successful publish evicts Feed and the created post owner's first
Profile posts page, refetches affected active Feed/Profile queries and invalidates Public Home
without blocking the completed publish.

## Target Structure

```txt
features/create-post/
  api/
    createPostUploadApi.ts
    createPostApi.ts
  model/
    createPostUploadService.ts
```

### `features/create-post/api/createPostUploadApi.ts`

Responsibilities:

- call `initiateUploadBatch`;
- call `completeUpload`;
- expose typed API wrappers for upload-specific backend operations;
- keep GraphQL/Apollo details out of UI components.

This module must not:

- send binary files through GraphQL;
- know about React component state;
- build UI state patches by array index.

### `features/create-post/api/createPostApi.ts`

Responsibilities:

- call `createPost`;
- accept ordered `fileIds` and optional description;
- keep post creation separate from storage `PUT`.

This module must not:

- use `uploadUrl`;
- upload binaries;
- treat storage `PUT` success as backend `READY`.

### `features/create-post/model/createPostUploadService.ts`

Responsibilities:

- orchestrate the full publish pipeline;
- use create-post selectors to read upload candidates and ready file ids;
- map upload descriptors by `CreatePostImage.id`, which backend treats as `clientUploadId`;
- upload exported files directly to storage;
- dispatch upload state patches through reducer actions;
- return ordered `fileIds` only after all current images are backend `READY`.

The service lives in `features/create-post`, not `shared`, because it depends on Create Post state
contracts, selectors, upload status semantics and post publish flow.

Current integration boundary:

- `CreatePostFlow` owns the default publish connection point.
- Step components do not call this service directly.
- Step components do not receive Apollo clients, GraphQL operations, upload helpers or storage
  `PUT` functions.
- `onPublishAction` remains an optional shell-level override for tests/stories.

## Pipeline

```txt
selectUploadCandidates
↓
initiateUploadBatch
↓
map descriptors by imageId/clientUploadId
↓
PUT exported.file to uploadUrl
↓
applyUploadBatchState
↓
completeUpload
↓
mark READY
↓
selectReadyFileIds
↓
createPost
↓
reset/close
```

Detailed flow:

1. `selectUploadCandidates` returns current images that have `exported.file`.
2. Build `initiateUploadBatch` input from candidates:
   - `clientUploadId` comes from candidate `imageId`;
   - `originalName` comes from candidate `exportedFileInfo`;
   - `mimeType` and `size` describe the exact `image.exported.file` sent by storage `PUT`;
   - `purpose` is always `POST_IMAGE` for posts;
   - browser `image/jpeg` maps to `MimeType.JPEG`;
   - browser `image/png` maps to `MimeType.PNG`.
3. Call `initiateUploadBatch`.
4. Map backend descriptors by `clientUploadId`.
5. For every candidate, find its descriptor by `imageId`.
6. Upload candidate `exportedFile`, which is `image.exported.file`, to descriptor `uploadUrl`
   using storage `PUT`.
7. Use `applyUploadBatchState` to update upload state by `imageId`.
8. Call `completeUpload` with successfully uploaded files as `CompleteUploadInput[]`, one
   `{ fileId }` item per file.
9. Mark items as `ready` only when `completeUpload` returns `READY`.
10. Return ordered file ids for `createPost` in current `state.images` order.
11. Call `createPost` only after every current image returned `READY` from `completeUpload`.
12. On success, reset Create Post state and close or navigate according to the route shell.

## Rules

- Upload service belongs to `features/create-post`, not `shared`.
- UI components must not build backend upload payloads.
- Matching is only by `CreatePostImage.id`.
- `CreatePostImage.id` is the only frontend image identity and equals backend `clientUploadId`.
- Do not add a second `clientUploadId` field.
- For posts, `InitiateUploadInput.purpose` must be `POST_IMAGE`.
- `InitiateUploadInput.mimeType` must be GraphQL enum `JPEG` or `PNG`, not the browser MIME string.
- Do not use array index to match upload descriptors, upload state patches or ready file ids.
- Image order and upload identity are different concepts.
- `uploadUrl` is a temporary write URL, not a display URL.
- `uploaded` is not `ready`.
- Successful storage `PUT` can move an image to `uploaded`, but backend `READY` comes only from
  `completeUpload`.
- `createPost` must be called only after all selected images are `ready`.
- `fileIds` for `createPost` must preserve `state.images` order.
- Do not send original `image.file` when `image.exported.file` is required.
- Do not add GraphQL Upload for post media.
- Same-URL storage retries are bounded and apply only to network failures, `429` and `5xx`.
- Storage `403`, an expired URL and a backend-confirmed retryable completion failure can request a
  fresh presigned URL through `retryUpload` for the same `fileId` and exported `File`.
- `retryUpload` is called for one failed file at a time. Its backend `attempt` is authoritative and
  cannot exceed `5`.

## Error handling

The current implementation:

- fail publish if `initiateUploadBatch` fails;
- fail publish if any selected image has no returned descriptor;
- keep already `ready` images successful while retrying only the selected failed image;
- retry a storage `PUT` on the same URL for network failures, `429` and `5xx` with bounded backoff;
- request a fresh URL for storage `403`, expired URLs and retryable backend completion failures;
- call `completeUpload` only for successfully uploaded `{ fileId }` items;
- expose per-file retry when `completeUpload` returns `FAILED` with `retryable: true`;
- require file replacement when `completeUpload` returns `FAILED` with `retryable: false`;
- skip `createPost` unless all current images are `ready`.

The completion retry path does not branch on `failedReason` text. It retries `completeUpload`
before requesting a new URL for a retryable completion failure. Resumable uploads and retrying a
failed `createPost` remain outside this upload service.

## Upload service boundaries

- Apollo cache updates are owned by post-create synchronization, not by the upload service.
- UI progress indicators are owned by Create Post UI, not by the upload service.
- Resumable uploads.
- Draft persistence.
- Post Feed/Profile cache refresh is owned by post-create synchronization.

## Known follow-ups / non-blockers

- Crop, filters and final export are implemented per image. Filters preserve the immutable cropped
  base and replace only the final exported artifact.
- Cleanup of orphan backend files after an abandoned draft remains undefined.
- Resumable uploads and `createPost` idempotency remain undefined.
- Successful `createPost` uses the targeted Feed/Profile/Public Home synchronization described
  above; synchronization failure is isolated from publish success.
