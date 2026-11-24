import { getMe, getUser, type CurrentUser, writePublicUserCache } from '@/entities/user'

import { deleteProfilePhoto, setProfilePhoto } from '../api/avatarUploadApi'
import { uploadAvatar } from './uploadAvatar'

export type CurrentUserSynchronizer = (user: CurrentUser) => boolean

type UploadProfileAvatarOptions = Parameters<typeof uploadAvatar>[1]

export async function uploadAndSetProfileAvatar(
  file: File,
  synchronizeCurrentUser: CurrentUserSynchronizer,
  uploadOptions?: UploadProfileAvatarOptions,
): Promise<boolean> {
  const fileId = await uploadAvatar(file, uploadOptions)
  const updatedPublicUser = await setProfilePhoto(fileId)
  const currentUser = await getMe()

  if (!synchronizeCurrentUser(currentUser)) {
    return false
  }

  writePublicUserCache(updatedPublicUser)

  return true
}

export async function deleteAndSynchronizeProfileAvatar(
  userId: string,
  synchronizeCurrentUser: CurrentUserSynchronizer,
): Promise<boolean> {
  await deleteProfilePhoto()

  const [updatedPublicUser, currentUser] = await Promise.all([getUser(userId, 'no-cache'), getMe()])

  if (!updatedPublicUser) {
    throw new Error('Failed to load profile after deleting its photo.')
  }

  if (!synchronizeCurrentUser(currentUser)) {
    return false
  }

  writePublicUserCache(updatedPublicUser)

  return true
}
