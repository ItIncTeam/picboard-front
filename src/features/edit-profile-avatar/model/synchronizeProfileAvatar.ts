import {
  getMe,
  getUser,
  type CurrentUser,
  type PublicUser,
  writePublicUserCache,
} from '@/entities/user'

import { deleteProfilePhoto, setProfilePhoto, type ProfilePhotoUser } from '../api/avatarUploadApi'
import { uploadAvatar } from './uploadAvatar'

export type CurrentUserSynchronizer = (user: CurrentUser) => boolean

export type AvatarSyncOperation =
  | { kind: 'delete'; userId: string }
  | { kind: 'set'; publicUser: ProfilePhotoUser; userId: string }

export type AvatarSyncResult =
  | { status: 'synced' }
  | { operation: AvatarSyncOperation; status: 'sync-pending' }

type UploadProfileAvatarOptions = Parameters<typeof uploadAvatar>[1]

export async function uploadAndSetProfileAvatar(
  file: File,
  synchronizeCurrentUser: CurrentUserSynchronizer,
  uploadOptions?: UploadProfileAvatarOptions,
): Promise<AvatarSyncResult> {
  const fileId = await uploadAvatar(file, uploadOptions)
  const publicUser = await setProfilePhoto(fileId)

  return synchronizeProfileAvatar(
    { kind: 'set', publicUser, userId: publicUser.id },
    synchronizeCurrentUser,
  )
}

export async function deleteAndSynchronizeProfileAvatar(
  userId: string,
  synchronizeCurrentUser: CurrentUserSynchronizer,
): Promise<AvatarSyncResult> {
  await deleteProfilePhoto()

  return synchronizeProfileAvatar({ kind: 'delete', userId }, synchronizeCurrentUser)
}

export async function synchronizeProfileAvatar(
  operation: AvatarSyncOperation,
  synchronizeCurrentUser: CurrentUserSynchronizer,
): Promise<AvatarSyncResult> {
  try {
    const [currentUser, publicUser] = await Promise.all([
      getMe('no-cache'),
      getPublicUserForSynchronization(operation),
    ])

    if (
      !publicUser ||
      currentUser.id !== operation.userId ||
      !synchronizeCurrentUser(currentUser)
    ) {
      return { operation, status: 'sync-pending' }
    }

    writePublicUserCache(publicUser)

    return { status: 'synced' }
  } catch {
    return { operation, status: 'sync-pending' }
  }
}

function getPublicUserForSynchronization(
  operation: AvatarSyncOperation,
): Promise<PublicUser | null> {
  if (operation.kind === 'set') {
    return Promise.resolve(operation.publicUser)
  }

  return getUser(operation.userId, 'no-cache')
}
