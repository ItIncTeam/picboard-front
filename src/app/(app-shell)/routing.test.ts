import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const appShellRoot = path.join(process.cwd(), 'src', 'app', '(app-shell)')

const appRoute = (...segments: string[]) => path.join(appShellRoot, ...segments)

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    return entry.isDirectory() ? getSourceFiles(entryPath) : [entryPath]
  })
}

describe('persistent app shell routing', () => {
  it('places Main, Profile and Post Details below one shared layout owner', () => {
    const routes = [
      appRoute('(protected)', '(main)', 'main', 'page.tsx'),
      appRoute('(profile)', 'profile', '[userId]', 'page.tsx'),
      appRoute('(protected)', '(main)', 'posts', '[postId]', 'page.tsx'),
    ]

    expect(existsSync(appRoute('layout.tsx'))).toBe(true)
    expect(existsSync(appRoute('AppRouteShell.tsx'))).toBe(true)
    routes.forEach((route) => expect(existsSync(route)).toBe(true))
  })

  it('has one App Router owner of AdaptiveAppShell', () => {
    const appRoot = path.join(process.cwd(), 'src', 'app')
    const shellOwners = getSourceFiles(appRoot).filter(
      (file) => file.endsWith('.tsx') && readFileSync(file, 'utf8').includes('AdaptiveAppShell'),
    )

    expect(shellOwners).toEqual([appRoute('AppRouteShell.tsx')])
  })

  it('keeps intercepted and direct Create routes distinct and protected', () => {
    const interceptedRoute = appRoute('@modal', '(.)posts', 'create', 'page.tsx')
    const fallbackRoute = appRoute('(protected)', '(main)', 'posts', 'create', 'page.tsx')

    expect(existsSync(interceptedRoute)).toBe(true)
    expect(existsSync(fallbackRoute)).toBe(true)
    expect(existsSync(appRoute('@modal', 'default.tsx'))).toBe(true)
    expect(existsSync(appRoute('@modal', '[...catchAll]', 'page.tsx'))).toBe(true)

    const interceptedSource = readFileSync(interceptedRoute, 'utf8')
    const fallbackSource = readFileSync(fallbackRoute, 'utf8')

    expect(interceptedSource).toContain('ProtectedRouteBoundary')
    expect(interceptedSource).toContain('CreatePostModal')
    expect(fallbackSource).toContain('CreatePostPage')
  })
})
