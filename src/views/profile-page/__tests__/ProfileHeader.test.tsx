import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/app/globals.css'
import { I18nProvider } from '@/shared/lib/i18n'

import { ProfileHeader, type ProfileHeaderData } from '../ProfileHeader'

vi.mock('@/shared/assets', () => ({
  PersonIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- deterministic browser-test boundary
    <img alt={alt} src={src} />
  ),
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

type RenderResult = {
  container: HTMLDivElement
  root: Root
}

const profile: ProfileHeaderData = {
  avatarUrl: 'https://example.com/avatar.jpg',
  bio: 'Profile biography',
  displayName: 'Display Name',
  followersCount: 42,
  followingCount: 7,
  publicationsCount: 19,
  username: 'profile_username',
}

function renderHeader(data: ProfileHeaderData = profile, isOwner = false): RenderResult {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => {
    root.render(
      <I18nProvider>
        <ProfileHeader data={data} isOwner={isOwner} />
      </I18nProvider>,
    )
  })

  return { container, root }
}

describe('ProfileHeader', () => {
  const mountedRoots: RenderResult[] = []

  beforeEach(() => {
    const globalWithActEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean
    }

    globalWithActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    mountedRoots.forEach(({ container, root }) => {
      act(() => root.unmount())
      container.remove()
    })
    mountedRoots.length = 0
    await page.viewport(1280, 720)
  })

  it('renders a real avatar and ready counters independently from posts', () => {
    const view = renderHeader()
    mountedRoots.push(view)

    expect(view.container.querySelector('img')).toMatchObject({
      alt: 'profile_username avatar',
      src: 'https://example.com/avatar.jpg',
    })
    expect(view.container.textContent).toContain('19Publications')
    expect(view.container.textContent).toContain('42Followers')
    expect(view.container.textContent).toContain('7Following')
  })

  it('renders the existing avatar fallback and zero counters', () => {
    const view = renderHeader({
      ...profile,
      avatarUrl: null,
      followersCount: 0,
      followingCount: 0,
      publicationsCount: 0,
    })
    mountedRoots.push(view)

    expect(view.container.querySelector('img')).toBeNull()
    expect(view.container.querySelector('[aria-label="profile_username avatar"]')).toBeInstanceOf(
      SVGElement,
    )
    expect(view.container.textContent).toContain('0Publications')
    expect(view.container.textContent).toContain('0Followers')
    expect(view.container.textContent).toContain('0Following')
  })

  it.each([
    { bio: null, displayName: null },
    { bio: '', displayName: '' },
    { bio: '   ', displayName: '   ' },
  ])('handles empty optional values', ({ bio, displayName }) => {
    const view = renderHeader({ ...profile, bio, displayName })
    mountedRoots.push(view)

    expect(view.container.textContent).not.toContain('Display Name')
    expect(view.container.textContent).toContain('No information provided.')
  })

  it('uses an accessible fallback for an empty username', () => {
    const view = renderHeader({ ...profile, username: '   ' })
    mountedRoots.push(view)

    expect(view.container.querySelector('h1')).toHaveTextContent('Profile')
    expect(view.container.querySelector('img')).toHaveAttribute('alt', 'Profile avatar')
  })

  it('renders long username and bio values without changing their content', () => {
    const username = 'profile_username_with_a_long_visible_value'
    const bio = 'A long public biography '.repeat(20).trim()
    const view = renderHeader({ ...profile, bio, username })
    mountedRoots.push(view)

    expect(view.container.textContent).toContain(username)
    expect(view.container.textContent).toContain(bio)
  })

  it('renders a long display name and large counters without changing their values', () => {
    const displayName = 'LongUnbrokenDisplayName'.repeat(12)
    const view = renderHeader({
      ...profile,
      displayName,
      followersCount: 123_456_789,
      followingCount: 987_654_321,
      publicationsCount: 456_789_012,
    })
    mountedRoots.push(view)

    expect(view.container.textContent).toContain(displayName)
    expect(view.container.textContent).toContain('456789012Publications')
    expect(view.container.textContent).toContain('123456789Followers')
    expect(view.container.textContent).toContain('987654321Following')
  })

  it.each([320, 360, 480, 720, 1024])(
    'does not create horizontal overflow at a %dpx viewport',
    async (width) => {
      await page.viewport(width, 720)

      const view = renderHeader({
        ...profile,
        bio: 'LongUnbrokenBiography'.repeat(24),
        displayName: 'LongUnbrokenDisplayName'.repeat(12),
        followersCount: 123_456_789,
        followingCount: 987_654_321,
        publicationsCount: 456_789_012,
        username: 'long_unbroken_username'.repeat(12),
      })
      mountedRoots.push(view)

      expect(view.container.scrollWidth).toBeLessThanOrEqual(view.container.clientWidth)
    },
  )

  it.each([
    { avatarSize: 72, width: 320 },
    { avatarSize: 72, width: 480 },
    { avatarSize: 96, width: 720 },
    { avatarSize: 192, width: 1024 },
  ])('uses the responsive avatar size at $width px', async ({ avatarSize, width }) => {
    await page.viewport(width, 720)

    const view = renderHeader()
    mountedRoots.push(view)
    const avatar = view.container.querySelector('img')?.parentElement

    expect(avatar).toBeInstanceOf(HTMLElement)
    expect(avatar ? Number.parseFloat(getComputedStyle(avatar).width) : 0).toBe(avatarSize)
    expect(avatar ? Number.parseFloat(getComputedStyle(avatar).height) : 0).toBe(avatarSize)
  })

  it('shows Profile Settings only for the owner', () => {
    const publicView = renderHeader()
    const ownerView = renderHeader(profile, true)
    mountedRoots.push(publicView, ownerView)

    expect(publicView.container.querySelector('a[href="/settings/profile"]')).toBeNull()
    expect(ownerView.container.querySelector('a[href="/settings/profile"]')).toBeInstanceOf(
      HTMLAnchorElement,
    )

    const settingsLink = ownerView.container.querySelector<HTMLAnchorElement>(
      'a[href="/settings/profile"]',
    )
    settingsLink?.focus()
    expect(document.activeElement).toBe(settingsLink)
  })
})
