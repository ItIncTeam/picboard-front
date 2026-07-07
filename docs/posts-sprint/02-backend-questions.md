# Backend Questions For Posts Sprint

Этот документ отделяет уже подтвержденный backend contract от вопросов, которые всё еще нельзя
додумывать на frontend.

Create Post production code now includes create-post scoped GraphQL helpers, the feature-local
upload service and default publish integration. Apollo cache logic and non-create posts operations
remain follow-up implementation work.

Full confirmed contract: [Posts Backend Contract](./07-backend-contract.md).

## Confirmed

### Gateway endpoint

- Production: `https://gateway.picboard.space/api/v1`
- Local: `http://localhost:3000/api/v1`

### Upload flow

Backend-confirmed flow:

1. Frontend generates a unique `clientUploadId` for each selected image.
2. Frontend calls `initiateUploadBatch`.
3. Backend returns upload descriptors with `clientUploadId`, `fileId`, `uploadUrl` and `expiresAt`.
4. Frontend uploads binaries directly to storage via `PUT`.
5. Frontend calls `completeUpload` with uploaded `{ fileId }` input items.
6. Backend validates files and returns `READY` or `FAILED`.
7. Frontend calls `createPost` only after every selected file is `READY`.

GraphQL Upload is not used. Binary files are not sent to the GraphQL endpoint.

### Upload request mapping

`initiateUploadBatch` signature:

```graphql
initiateUploadBatch(input: [InitiateUploadInput!]!): [InitiateUploadPayload!]!
```

`InitiateUploadInput` item:

```ts
type InitiateUploadInput = {
  clientUploadId: string
  originalName: string
  purpose: 'POST_IMAGE'
  mimeType: 'JPEG' | 'PNG'
  size: number
}
```

`InitiateUploadPayload` item:

```ts
type InitiateUploadPayload = {
  clientUploadId: string
  fileId: string
  uploadUrl: string
  expiresAt: string
}
```

Frontend must map the response by `clientUploadId`, not by array order.

For posts, frontend must send `purpose: POST_IMAGE`.

Browser MIME string mapping:

- `image/jpeg` -> `MimeType.JPEG`;
- `image/png` -> `MimeType.PNG`.

### Storage upload

Frontend performs:

```ts
async function uploadToStorage(uploadUrl: string, file: File) {
  return fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })
}
```

Confirmed rules:

- `uploadUrl` is temporary;
- `uploadUrl` is not a display URL;
- `uploadUrl` cannot be reused after expiration;
- successful upload means HTTP `2xx`;
- the `PUT` request goes directly to storage, not GraphQL.

### Upload completion

`completeUpload` signature:

```graphql
completeUpload(input: [CompleteUploadInput!]!): [CompleteUploadPayload!]!
```

`CompleteUploadInput` item:

```ts
type CompleteUploadInput = {
  fileId: string
}
```

`CompleteUploadPayload` item:

```ts
type CompleteUploadPayload = {
  fileId: string
  status: 'PENDING' | 'UPLOADED' | 'READY' | 'FAILED' | 'DELETED'
}
```

`READY` means the file exists in storage, backend validated it, and it can be attached to a post.

### File and post limits

Confirmed image constraints:

- allowed MIME types: `image/jpeg`, `image/png`;
- minimum images per post: `1`;
- maximum images per post: `10`;
- maximum file size: `20 MB`.

Confirmed post description constraints:

- optional;
- maximum length: `500` characters.

### `createPost`

Signature:

```graphql
createPost(input: CreatePostInput!): PostEntity!
```

Frontend sends:

```ts
type CreatePostInput = {
  fileIds: string[]
  description?: string
}
```

`createPost` may be called only after all selected files are `READY`.

### Post update/delete

Confirmed mutations:

```graphql
updatePostDescription(input: UpdatePostDescriptionInput!): PostEntity!
deletePost(input: DeletePostInput!): Boolean!
```

Inputs:

```ts
type UpdatePostDescriptionInput = {
  postId: string
  description: string
}

type DeletePostInput = {
  postId: string
}
```

### `profilePosts`

`profilePosts` uses cursor pagination.

Signature:

```graphql
profilePosts(input: ProfilePostsInput!): PostConnection!
```

Input:

```ts
type ProfilePostsInput = {
  userId: string
  first?: number
  after?: string
}
```

Current backend page size is 8 posts. Frontend should prepare infinite scroll around cursor
pagination.

### `feed` and `post`

Confirmed queries:

```graphql
feed: [PostEntity!]!
post(id: String!): PostEntity
```

## Resolved

### Display URLs For Images

Backend exposes image URLs through `PostAttachmentEntity.file.url`.

Backend-confirmed schema:

```graphql
type PostAttachmentEntity {
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
import Image from 'next/image'

type AttachmentWithFile = {
  file: {
    url: string
  }
}

function PostAttachmentImage({ attachment }: { attachment: AttachmentWithFile }) {
  return <Image src={attachment.file.url} alt="" width={320} height={320} />
}
```

Status:

Backend-confirmed display URL contract.

Frontend must not use `uploadUrl` as a display URL.

## Remaining Questions

No schema names are open for the current Posts Sprint handoff. Remaining items are implementation
or product/cache details.

## Known limitations

- Retry/idempotency strategy is still open for expired `uploadUrl`, failed storage `PUT`, failed
  `completeUpload` and failed `createPost`.
- Partial upload failure behavior is not confirmed. Current frontend upload service fails fast if a
  storage `PUT` fails.
- Backend error codes/messages are not finalized for unsupported type, oversized file, too many
  files, auth failure and storage validation failure.
- Cache/refetch strategy is not finalized for create, update, delete, profile, feed and details
  surfaces.
- Public main page contract for registered users count is still open.

## Follow-up Questions

These are not blockers for documenting the current backend contract, but should be clarified before
production integration:

- retry/idempotency strategy for expired `uploadUrl`, failed storage `PUT`, failed
  `completeUpload`, and failed `createPost`;
- backend error codes/messages for unsupported type, file too large, too many files, auth failure
  and storage validation failure;
- whether frontend should request width/height or other media metadata in posts queries;
- edit/delete permissions and error model;
- cache/refetch strategy for create, update, delete, profile, feed and details surfaces;
- public main page contract for registered users count.
