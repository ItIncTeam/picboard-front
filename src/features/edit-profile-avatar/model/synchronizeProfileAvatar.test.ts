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
  synchronizeProfileAvatar,
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

  it('synchronizes Me before writing the verified set payload to Public User cache', async () => {
    const synchronize = vi.fn(() => true)
    uploadMocks.uploadAvatar.mockResolvedValueOnce('file-1')
    apiMocks.setProfilePhoto.mockResolvedValueOnce(publicUser)
    entityMocks.getMe.mockResolvedValueOnce(currentUser)

    await expect(
      uploadAndSetProfileAvatar(new File(['avatar'], 'avatar.jpg'), synchronize),
    ).resolves.toEqual({ status: 'synced' })

    expect(apiMocks.setProfilePhoto).toHaveBeenCalledWith('file-1')
    expect(entityMocks.getMe).toHaveBeenCalledWith('no-cache')
    expect(synchronize).toHaveBeenCalledWith(currentUser)
    expect(entityMocks.writePublicUserCache).toHaveBeenCalledWith(publicUser)
  })

  it('returns a set receipt when Me sync fails and recovers without another upload or set', async () => {
    const synchronize = vi.fn(() => true)
    const file = new File(['avatar'], 'avatar.jpg')
    uploadMocks.uploadAvatar.mockResolvedValueOnce('file-1')
    apiMocks.setProfilePhoto.mockResolvedValueOnce(publicUser)
    entityMocks.getMe.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(currentUser)

    const pending = await uploadAndSetProfileAvatar(file, synchronize)

    expect(pending).toEqual({
      operation: { kind: 'set', publicUser, userId: 'user-1' },
      status: 'sync-pending',
    })
    expect(entityMocks.writePublicUserCache).not.toHaveBeenCalled()
    if (pending.status !== 'sync-pending') {
      throw new Error('Expected pending avatar synchronization.')
    }

    await expect(synchronizeProfileAvatar(pending.operation, synchronize)).resolves.toEqual({
      status: 'synced',
    })
    expect(uploadMocks.uploadAvatar).toHaveBeenCalledOnce()
    expect(apiMocks.setProfilePhoto).toHaveBeenCalledOnce()
    expect(entityMocks.writePublicUserCache).toHaveBeenCalledWith(publicUser)
  })

  it('returns a delete receipt when Public User sync fails and recovers without another delete', async () => {
    const deletedPublicUser = { ...publicUser, avatar: null, profilePictureFileId: null }
    const deletedCurrentUser = { ...currentUser, avatar: null, profilePictureFileId: null }
    const synchronize = vi.fn(() => true)
    apiMocks.deleteProfilePhoto.mockResolvedValueOnce(undefined)
    entityMocks.getMe
      .mockResolvedValueOnce(deletedCurrentUser)
      .mockResolvedValueOnce(deletedCurrentUser)
    entityMocks.getUser
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(deletedPublicUser)

    const pending = await deleteAndSynchronizeProfileAvatar('user-1', synchronize)

    expect(pending).toEqual({
      operation: { kind: 'delete', userId: 'user-1' },
      status: 'sync-pending',
    })
    expect(entityMocks.writePublicUserCache).not.toHaveBeenCalled()
    if (pending.status !== 'sync-pending') {
      throw new Error('Expected pending avatar synchronization.')
    }

    await expect(synchronizeProfileAvatar(pending.operation, synchronize)).resolves.toEqual({
      status: 'synced',
    })
    expect(apiMocks.deleteProfilePhoto).toHaveBeenCalledOnce()
    expect(entityMocks.getUser).toHaveBeenCalledWith('user-1', 'no-cache')
    expect(entityMocks.writePublicUserCache).toHaveBeenCalledWith(deletedPublicUser)
  })

  it('does not write cache after a session change or a different Me user', async () => {
    entityMocks.getMe
      .mockResolvedValueOnce(currentUser)
      .mockResolvedValueOnce({ ...currentUser, id: 'other-user' })

    await expect(
      synchronizeProfileAvatar({ kind: 'set', publicUser, userId: 'user-1' }, () => false),
    ).resolves.toMatchObject({ status: 'sync-pending' })
    await expect(
      synchronizeProfileAvatar({ kind: 'set', publicUser, userId: 'user-1' }, () => true),
    ).resolves.toMatchObject({ status: 'sync-pending' })

    expect(entityMocks.writePublicUserCache).not.toHaveBeenCalled()
  })
})
