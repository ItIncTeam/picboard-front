# Posts Backend Contract

Source of truth: backend-confirmed Posts Sprint contract.

This document fixes the frontend integration target. It does not mean the frontend has already
implemented GraphQL operations, Apollo cache updates, reducer changes or UI behavior.

## Upload Flow

Backend-confirmed flow:

1. User selects images.
2. Frontend generates a unique `clientUploadId` for each image.
3. Frontend calls `initiateUploadBatch`.
4. Backend returns upload descriptors.
5. Frontend uploads binaries directly to storage using `PUT` requests.
6. Frontend calls `completeUploadBatch`.
7. Backend validates uploads and marks files `READY`.
8. Frontend calls `createPost`.

GraphQL Upload is not used.

Binary files are not sent through GraphQL.

## Upload Constraints

Images:

- allowed MIME types: `image/jpeg`, `image/png`;
- images per post: minimum `1`, maximum `10`;
- maximum file size: `20 MB`.

Frontend validation should mirror these constraints before the upload flow starts. Backend still
owns final validation.

## Post Constraints

Description:

- optional;
- maximum length: `500` characters.

## `initiateUploadBatch`

Frontend sends:

```ts
{
  uploads: [
    {
      clientUploadId: string
      originalName: string
      mimeType: string
      size: number
    },
  ]
}
```

Backend returns:

```ts
{
  uploads: [
    {
      clientUploadId: string
      fileId: string
      uploadUrl: string
      expiresAt: string
    },
  ]
}
```

Frontend must map the response by `clientUploadId`.

Frontend must not rely on array order.

## Upload To Storage

Frontend uploads each exported file directly to the returned storage URL:

```ts
fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': file.type,
  },
  body: file,
})
```

Rules:

- `uploadUrl` is temporary;
- `uploadUrl` is not a display URL;
- `uploadUrl` cannot be reused after expiration;
- successful upload means HTTP `2xx`;
- the `PUT` request goes directly to storage;
- the `PUT` request does not go to the GraphQL endpoint.

## `completeUploadBatch`

Frontend sends:

```ts
{
  fileIds: string[]
}
```

Backend returns:

```ts
{
  fileId: string
  status: 'READY' | 'FAILED'
}
```

`READY` means:

- file exists in storage;
- backend validated upload;
- file can be attached to post.

## `createPost`

Frontend sends:

```ts
{
  fileIds: string[]
  description?: string
}
```

`createPost` may be called only after all selected files are `READY`.

## Posts Queries

### `profilePosts`

Uses cursor pagination.

Arguments:

```ts
{
  first: number
  after?: string
}
```

Current backend page size:

```txt
8 posts
```

Frontend should prepare infinite scroll around cursor pagination.

## Expected Display URL Contract

Expected backend schema:

```graphql
type PostAttachment {
  fileId: ID!
  sortOrder: Int!
  file: File!
}

type File {
  id: ID!
  url: String!
}
```

Frontend rendering:

```tsx
<Image src={attachment.file.url} />
```

Status:

Expected backend update. Not yet confirmed as deployed.

Image URL is not expected to be stored directly in `Post` or `PostAttachment`. Frontend should read
the display URL through `attachment.file.url` after the backend schema update is confirmed.

## Frontend State Mapping

Current target mapping:

- `CreatePostImage.id` maps to backend `clientUploadId`;
- `CreatePostImage.exported.file` is the file used for upload.

Future backend integration state should track upload progress without treating temporary upload URLs
as display URLs:

```ts
upload: {
  fileId?: string
  uploadUrl?: string
  status: 'idle' | 'uploading' | 'uploaded' | 'failed' | 'ready'
}
```

This is a target integration state. Do not claim these exact fields already exist unless production
code has been updated. The current frontend state may use more granular intermediate statuses while
the backend integration is still pending.

## Publish Pipeline

Future frontend flow:

1. Collect exported files.
2. Build `initiateUploadBatch` input.
3. Call `initiateUploadBatch`.
4. Map response by `clientUploadId`.
5. Upload every file via `PUT`.
6. Collect uploaded `fileIds`.
7. Call `completeUploadBatch`.
8. Verify `READY` status for every selected file.
9. Call `createPost`.
10. Update Apollo cache or refetch.
11. Reset `CreatePostState`.
12. Close modal.

## Open Questions

Still unresolved:

1. Main feed query contract.
2. Post details query contract.

## Implementation Boundaries

Do not change production code until the implementation PR starts.

Do not add:

- GraphQL Upload;
- binary upload through GraphQL;
- order-based mapping for upload descriptors;
- `createPost` before every selected file is `READY`;
- display usage of `uploadUrl`;
- Apollo cache logic before posts operations are implemented.
