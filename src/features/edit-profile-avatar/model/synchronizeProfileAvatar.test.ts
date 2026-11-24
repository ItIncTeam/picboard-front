import { afterEach, describe, expect, it, vi } from 'vitest'

const entityMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  getUser: vi.fn(),
  writePublicUserCache: vi.fn(),
}))
const apiMocks = vi.hoisted(() => ({ deleteProfilePhoto: vi.fn(), setProfilePhoto: vi.fn() }))
const uploadMocks = vi.hoisted(() => ({ uploadAvatar: vi.fn() }))

vi.mock('@/entities/user', () => entityMocks)
vi.mock('../api/avatarUploadApi', () => apiMocks)
vi.mock('./uploadAvatar', () => uploadMocks)

import {
  deleteAndSynchronizeProfileAvatar,
  uploadAndSetProfileAvatar,
} from './synchronizeProfileAvatar'

const currentUser = {
  aboutMe: null,
  avatar: { id: 'file-1', url: 'https://cdn.example/avatar.jpg' },
  city: null,
  cityId: null,
  country: null,
  countryId: null,
  dateOfBirth: null,
  displayName: 'User',
  email: 'user@example.com',
  firstName: null,
  id: 'user-1',
  isConfirmed: true,
  lastName: null,
  profilePictureFileId: 'file-1',
  username: 'user',
}
const publicUser = {
  aboutMe: null,
  avatar: { id: 'file-1', url: 'https://cdn.example/avatar.jpg' },
  displayName: 'User',
  id: 'user-1',
  profilePictureFileId: 'file-1',
  username: 'user',
}

describe('profile avatar synchronization', () => {
  afterEach(() => {
    entityMocks.getMe.mockReset()
    entityMocks.getUser.mockReset()
    entityMocks.writePublicUserCache.mockReset()
    apiMocks.deleteProfilePhoto.mockReset()
    apiMocks.setProfilePhoto.mockReset()
    uploadMocks.uploadAvatar.mockReset()
  })

  it('uses only a ready uploaded file, then synchronizes Me before public User cache', async () => {
    const synchronize = vi.fn(() => true)
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    uploadMocks.uploadAvatar.mockResolvedValueOnce('file-1')
    apiMocks.setProfilePhoto.mockResolvedValueOnce(publicUser)
    entityMocks.getMe.mockResolvedValueOnce(currentUser)

    await expect(uploadAndSetProfileAvatar(file, synchronize)).resolves.toBe(true)

    expect(apiMocks.setProfilePhoto).toHaveBeenCalledWith('file-1')
    expect(synchronize).toHaveBeenCalledWith(currentUser)
    expect(entityMocks.writePublicUserCache).toHaveBeenCalledWith(publicUser)
  })

  it('does not let an expired session write a late set response to public cache', async () => {
    uploadMocks.uploadAvatar.mockResolvedValueOnce('file-1')
    apiMocks.setProfilePhoto.mockResolvedValueOnce(publicUser)
    entityMocks.getMe.mockResolvedValueOnce(currentUser)

    await expect(
      uploadAndSetProfileAvatar(new File(['avatar'], 'avatar.jpg'), () => false),
    ).resolves.toBe(false)
    expect(entityMocks.writePublicUserCache).not.toHaveBeenCalled()
  })

  it('refetches Public User without cache and Me after delete', async () => {
    const deletedPublicUser = { ...publicUser, avatar: null, profilePictureFileId: null }
    const deletedCurrentUser = { ...currentUser, avatar: null, profilePictureFileId: null }
    const synchronize = vi.fn(() => true)
    apiMocks.deleteProfilePhoto.mockResolvedValueOnce(undefined)
    entityMocks.getUser.mockResolvedValueOnce(deletedPublicUser)
    entityMocks.getMe.mockResolvedValueOnce(deletedCurrentUser)

    await expect(deleteAndSynchronizeProfileAvatar('user-1', synchronize)).resolves.toBe(true)

    expect(entityMocks.getUser).toHaveBeenCalledWith('user-1', 'no-cache')
    expect(synchronize).toHaveBeenCalledWith(deletedCurrentUser)
    expect(entityMocks.writePublicUserCache).toHaveBeenCalledWith(deletedPublicUser)
  })

  it('does not let an expired session write a late delete response to public cache', async () => {
    apiMocks.deleteProfilePhoto.mockResolvedValueOnce(undefined)
    entityMocks.getUser.mockResolvedValueOnce({
      ...publicUser,
      avatar: null,
      profilePictureFileId: null,
    })
    entityMocks.getMe.mockResolvedValueOnce({
      ...currentUser,
      avatar: null,
      profilePictureFileId: null,
    })

    await expect(deleteAndSynchronizeProfileAvatar('user-1', () => false)).resolves.toBe(false)
    expect(entityMocks.writePublicUserCache).not.toHaveBeenCalled()
  })
})
