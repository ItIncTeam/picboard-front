# Create Post Upload Service Plan

This document fixes the frontend service structure for the future Create Post upload integration.
Backend operations and constraints are defined in [Posts Backend Contract](./07-backend-contract.md).
Shared frontend state and selector contracts are defined in
[Frontend Contracts](./08-frontend-contracts.md).

This is an implementation plan. It does not mean production code already contains GraphQL
operations, Apollo cache updates, storage upload helpers or publish integration.

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
- call `completeUploadBatch`;
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
- call `createPost` only after all current images are backend `READY`.

The service lives in `features/create-post`, not `shared`, because it depends on Create Post state
contracts, selectors, upload status semantics and post publish flow.

Current integration boundary:

- `CreatePostFlow` exposes `onPublishAction` as the future publish connection point.
- Step components do not call this service directly.
- Step components do not receive Apollo clients, GraphQL operations, upload helpers or storage
  `PUT` functions.
- Backend integration is still not implemented until the schema exposes the required operations.

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
completeUploadBatch
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
   - `originalName`, `mimeType` and `size` come from `exported.fileInfo`.
3. Call `initiateUploadBatch`.
4. Map backend descriptors by `clientUploadId`.
5. For every candidate, find its descriptor by `imageId`.
6. Upload `candidate.file` to descriptor `uploadUrl` using storage `PUT`.
7. Use `applyUploadBatchState` to update upload state by `imageId`.
8. Call `completeUploadBatch` with successfully uploaded `fileIds`.
9. Mark items as `ready` only when `completeUploadBatch` returns `READY`.
10. Use `selectReadyFileIds` to collect ordered file ids for `createPost`.
11. Call `createPost` only after every current image has `upload.status === 'ready'` and `fileId`.
12. On success, reset Create Post state and close or navigate according to the route shell.

## Rules

- Upload service belongs to `features/create-post`, not `shared`.
- UI components must not build backend upload payloads.
- Matching is only by `CreatePostImage.id`.
- `CreatePostImage.id` is the frontend identity and backend `clientUploadId`.
- Do not use array index to match upload descriptors, upload state patches or ready file ids.
- Image order and upload identity are different concepts.
- `uploadUrl` is a temporary write URL, not a display URL.
- `uploaded` is not `ready`.
- Successful storage `PUT` can move an image to `uploaded`, but backend `READY` comes only from
  `completeUploadBatch`.
- `createPost` must be called only after all selected images are `ready`.
- `fileIds` for `createPost` must preserve `state.images` order.
- Do not send original `image.file` when `image.exported.file` is required.
- Do not add GraphQL Upload for post media.

## Error Handling Direction

Minimal first implementation should:

- fail publish if `initiateUploadBatch` fails;
- fail publish if any selected image has no returned descriptor;
- mark an image as `failed` if its storage `PUT` fails;
- call `completeUploadBatch` only for successfully uploaded `fileIds`;
- fail publish if `completeUploadBatch` returns `FAILED` for any selected file;
- skip `createPost` unless all current images are `ready`.

Retry, resumable upload, partial publish and expired `uploadUrl` recovery are follow-up decisions.

## Out Of Scope

- GraphQL operation implementation in documentation work.
- Apollo cache updates.
- Storage `PUT` helper implementation.
- UI progress indicators.
- Retry queue or resumable uploads.
- Draft persistence.
- Post feed/profile cache refresh strategy.
