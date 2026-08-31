# Posts Backend Contract

Source of truth: backend-confirmed Posts Sprint contract.

This document fixes the frontend integration target. Current implementation status is tracked in
the sprint overview, frontend contracts and upload service plan.

## Gateway Endpoint

- Production: `https://gateway.picboard.space/api/v1`
- Local: `http://localhost:3000/api/v1`

Frontend posts/upload GraphQL operations must target the gateway endpoint for the current
environment.

## Upload Flow

Backend-confirmed flow:

1. User selects images.
2. Frontend generates a unique `clientUploadId` for each image.
3. Frontend calls `initiateUploadBatch`.
4. Backend returns upload descriptors.
5. Frontend uploads binaries directly to storage using `PUT` requests.
6. Frontend calls `completeUpload`.
7. Backend validates uploads and returns `READY` or `FAILED`.
8. Frontend calls `createPost` only after every selected file is `READY`.

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

Mutation:

```graphql
initiateUploadBatch(input: [InitiateUploadInput!]!): [InitiateUploadPayload!]!
```

Frontend sends one input item per exported image:

```ts
type InitiateUploadInput = {
  clientUploadId: string
  originalName: string
  purpose: 'POST_IMAGE'
  mimeType: 'JPEG' | 'PNG'
  size: number
}
```

Backend returns:

```ts
type InitiateUploadPayload = {
  clientUploadId: string
  fileId: string
  uploadUrl: string
  expiresAt: string
}
```

Frontend must map the response by `clientUploadId`.

Frontend must not rely on array order.

For posts, `purpose` must be `POST_IMAGE`.

GraphQL enum mapping:

- browser `image/jpeg` -> `MimeType.JPEG`;
- browser `image/png` -> `MimeType.PNG`.

## Upload To Storage

Frontend uploads each exported file directly to the returned storage URL:

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

Rules:

- `uploadUrl` is temporary;
- `uploadUrl` is not a display URL;
- `uploadUrl` cannot be reused after expiration;
- successful upload means HTTP `2xx`;
- the `PUT` request goes directly to storage;
- the `PUT` request does not go to the GraphQL endpoint.

## `completeUpload`

Mutation:

```graphql
completeUpload(input: [CompleteUploadInput!]!): [CompleteUploadPayload!]!
```

Frontend sends:

```ts
type CompleteUploadInput = {
  fileId: string
}
```

Backend returns one payload item per completed file:

```ts
type CompleteUploadPayload = {
  fileId: string
  status: 'PENDING' | 'UPLOADED' | 'READY' | 'FAILED' | 'DELETED'
}
```

`READY` means:

- file exists in storage;
- backend validated upload;
- file can be attached to post.

## `createPost`

Mutation:

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

## Post Mutations

```graphql
updatePostDescription(input: UpdatePostDescriptionInput!): PostEntity!
deletePost(input: DeletePostInput!): Boolean!
```

```ts
type UpdatePostDescriptionInput = {
  postId: string
  description: string
}

type DeletePostInput = {
  postId: string
}
```

## Posts Queries

### `profilePosts`

Uses cursor pagination.

Query:

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

The live gateway schema defines `first = 8`. The current frontend guard accepts explicit values
from 1 through 8. Frontend should prepare infinite scroll around cursor pagination.

### `feed`

```graphql
feed: [PostEntity!]!
```

Backend guarantees that `feed` returns at most 4 posts ordered by `createdAt DESC`. The field has no
pagination arguments, and infinite scroll is outside the current Public Home scope. Frontend must
preserve the returned post order and must not own an additional feed limit or sorting rule.

The backend currently exposes no separate authenticated/personalized feed. Authenticated `/main`
therefore uses this same global latest-four field through Apollo Client, while `/feed` redirects to
`/main`. Each post includes its author identity; likes, comments, bookmarks and follow state are not
part of this contract.

### `post`

```graphql
post(id: String!): PostEntity
```

`post` may return `null` when the backend cannot return an entity for the provided id.

### Post author

```graphql
type PostEntity {
  id: ID!
  ownerId: String!
  description: String
  attachments: [PostAttachmentEntity!]!
  author: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

Post UI selects only `author.id`, `author.username`, `author.displayName` and
`author.profilePictureFileId`. `profilePictureFileId` is an ID, not a display URL. Ownership and
menu permissions continue to compare session user ID with `PostEntity.ownerId`.

## Display URL Contract

Backend-confirmed schema:

```graphql
type PostAttachmentEntity {
  fileId: ID!
  sortOrder: Int!
  file: File
}

type File {
  id: ID!
  ownerId: String!
  originalName: String!
  purpose: Purpose!
  mimeType: MimeType!
  size: Int!
  status: FileStatus!
  url: String!
}
```

`PostAttachmentEntity.file` is nullable. When `file` is present, `file.url` is non-null.

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

Image URL is not expected to be stored directly in `Post` or `PostAttachment`. Frontend should read
the display URL through `attachment.file.url`.

### `usersCount`

```graphql
usersCount: Int!
```

The field is available for the Public Main registered-users count. Public access and cache policy
remain integration decisions.

## Frontend State Mapping

Current target mapping:

- `CreatePostImage.id` maps to backend `clientUploadId`;
- `CreatePostImage.exported.file` is the file used for upload.

Future backend integration state should track upload progress without treating temporary upload URLs
as display URLs:

```ts
type CreatePostUploadIntegrationState = {
  upload: {
    fileId?: string
    uploadUrl?: string
    status: 'idle' | 'uploading' | 'uploaded' | 'failed' | 'ready'
  }
}
```

This state shape exists in current frontend types. The backend upload pipeline that writes these
fields is still pending.

## Publish Pipeline

Current frontend flow:

1. Collect exported files.
2. Build `initiateUploadBatch` input.
3. Call `initiateUploadBatch`.
4. Map response by `clientUploadId`.
5. Upload every file via `PUT`.
6. Collect uploaded `fileIds`.
7. Call `completeUpload`.
8. Verify `READY` status for every selected file.
9. Call `createPost`.
10. Start isolated post-create synchronization: evict `ROOT_QUERY.feed` and the created post
    owner's first `profilePosts(first: 8)` page, refetch the affected active Apollo Feed/Profile
    queries and call fixed-path `revalidatePath('/')` through a Server Action.
11. Reset `CreatePostState` and close without waiting for synchronization.
12. Log Feed and Public Home synchronization failures separately without exposing publish retry.

## Delete Pipeline

Current frontend flow:

1. Owner-only Post Details menu opens the independent `features/delete-post` flow through its
   trigger boundary.
2. `DeletePostConfirm` calls the existing `deletePost(input: { postId })` mutation.
3. Delete mutation errors are shown as deletion errors and keep the user on the post.
4. After a successful delete, post-success synchronization errors are logged/isolated and do not
   re-enable deleting the same post.
5. Apollo cache evicts the deleted `PostEntity`, `ROOT_QUERY.feed` and `ROOT_QUERY.profilePosts`.
6. Active `Feed` and `ProfilePosts` queries are refetched when present.
7. Public Home is invalidated through fixed-path `revalidatePath('/')` exposed from the post entity
   server-only entrypoint.
8. After successful deletion the flow redirects to the sanitized `returnTo` from Post Details,
   otherwise `/main`. Missing or unsafe `returnTo` falls back to `/main` regardless of post-success
   callback or synchronization failures.

## Current Open Integration Questions

The operation names, input names and entity names above are no longer blocked. Remaining questions
are implementation details, not backend schema blockers:

1. retry/idempotency strategy for expired `uploadUrl`, failed storage `PUT`, failed
   `completeUpload`, and failed `createPost`;
2. backend error codes/messages for unsupported type, file too large, too many files, auth failure
   and storage validation failure;
3. whether frontend should request width/height or other media metadata in post rendering queries.

## Implementation Boundaries

Do not change production code until the implementation PR starts.

Do not add:

- GraphQL Upload;
- binary upload through GraphQL;
- order-based mapping for upload descriptors;
- `createPost` before every selected file is `READY`;
- display usage of `uploadUrl`;
- Apollo cache logic before posts operations are implemented.
