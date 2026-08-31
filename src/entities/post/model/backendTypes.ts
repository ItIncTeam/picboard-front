export type Purpose = 'POST_IMAGE' | 'BILL'

export type MimeType = 'JPEG' | 'PNG'

export type FileStatus = 'PENDING' | 'UPLOADED' | 'READY' | 'FAILED' | 'DELETED'

export type File = {
  id: string
  mimeType: MimeType
  originalName: string
  ownerId: string
  purpose: Purpose
  size: number
  status: FileStatus
  url: string
}

export type PostAttachmentEntity = {
  file: File | null
  fileId: string
  sortOrder: number
}

export type PostAuthor = {
  displayName: string | null
  id: string
  profilePictureFileId: string | null
  username: string
}

export type PostEntity = {
  attachments: PostAttachmentEntity[]
  author: PostAuthor
  createdAt: string
  description: string | null
  id: string
  ownerId: string
  updatedAt: string
}

export type PageInfo = {
  endCursor: string | null
  hasNextPage: boolean
  startCursor: string | null
}

export type PostEdge = {
  cursor: string
  node: PostEntity
}

export type PostConnection = {
  edges: PostEdge[]
  pageInfo: PageInfo
}
