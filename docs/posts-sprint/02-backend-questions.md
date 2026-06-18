# Backend Questions For Posts Sprint

Этот документ отделяет уже подтвержденный backend contract от вопросов, которые всё еще нельзя
додумывать на frontend.

Frontend не добавляет production GraphQL operations, Apollo cache logic или upload integration до
отдельного implementation PR.

Full confirmed contract: [Posts Backend Contract](./07-backend-contract.md).

## Confirmed

### Upload flow

Backend-confirmed flow:

1. Frontend generates a unique `clientUploadId` for each selected image.
2. Frontend calls `initiateUploadBatch`.
3. Backend returns upload descriptors with `clientUploadId`, `fileId`, `uploadUrl` and `expiresAt`.
4. Frontend uploads binaries directly to storage via `PUT`.
5. Frontend calls `completeUploadBatch` with uploaded `fileIds`.
6. Backend validates files and returns `READY` or `FAILED`.
7. Frontend calls `createPost` only after every selected file is `READY`.

GraphQL Upload is not used. Binary files are not sent to the GraphQL endpoint.

### Upload request mapping

`initiateUploadBatch` input:

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

`initiateUploadBatch` response:

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

Frontend must map the response by `clientUploadId`, not by array order.

### Storage upload

Frontend performs:

```ts
fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': file.type,
  },
  body: file,
})
```

Confirmed rules:

- `uploadUrl` is temporary;
- `uploadUrl` is not a display URL;
- `uploadUrl` cannot be reused after expiration;
- successful upload means HTTP `2xx`;
- the `PUT` request goes directly to storage, not GraphQL.

### Upload completion

`completeUploadBatch` input:

```ts
{
  fileIds: string[]
}
```

`completeUploadBatch` response item:

```ts
{
  fileId: string
  status: 'READY' | 'FAILED'
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

Frontend sends:

```ts
{
  fileIds: string[]
  description?: string
}
```

`createPost` may be called only after all selected files are `READY`.

### `profilePosts`

`profilePosts` uses cursor pagination.

Arguments:

```ts
{
  first: number
  after?: string
}
```

Current backend page size is 8 posts. Frontend should prepare infinite scroll around cursor
pagination.

## Resolved / Partially Resolved

### Display URLs For Images

Backend plans to expose image URLs through `PostAttachment.file.url`.

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

Frontend must not use `uploadUrl` as a display URL.

## Still Open

### Main Feed Query

Still unresolved:

- operation name;
- arguments;
- pagination model and page size;
- auth requirements;
- cache/SSR/ISR expectations;
- response fields for feed cards.

### Post Details Query

Still unresolved:

- operation name;
- arguments;
- deployed attachment display URL schema;
- owner/viewer fields;
- edit/delete permissions;
- not found, forbidden and deleted error model.

## Follow-up Questions

These are not blockers for documenting the current backend contract, but should be clarified before
production integration:

- retry/idempotency strategy for expired `uploadUrl`, failed storage `PUT`, failed
  `completeUploadBatch`, and failed `createPost`;
- backend error codes/messages for unsupported type, file too large, too many files, auth failure
  and storage validation failure;
- whether frontend should request width/height or other media metadata in posts queries;
- post edit/delete mutation contracts;
- public main page contract for 4 latest posts and registered users count.
