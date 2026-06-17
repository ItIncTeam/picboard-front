const currentPathnameStorageKey = 'picboard.routeHistory.currentPathname'
const previousPathnameStorageKey = 'picboard.routeHistory.previousPathname'

const safeExactPathnames = new Set(['/main', '/feed', '/search', '/favorites', '/statistics'])

const safePathnamePrefixes = ['/profile/', '/posts/', '/settings/']

export function rememberRoutePathname(pathname: string): void {
  const currentPathname = window.sessionStorage.getItem(currentPathnameStorageKey)

  if (currentPathname === pathname) {
    return
  }

  if (currentPathname === null) {
    window.sessionStorage.removeItem(previousPathnameStorageKey)
  } else {
    window.sessionStorage.setItem(previousPathnameStorageKey, currentPathname)
  }

  window.sessionStorage.setItem(currentPathnameStorageKey, pathname)
}

export function getStoredPreviousPathname(): string | null {
  return window.sessionStorage.getItem(previousPathnameStorageKey)
}

export function getSafeCreatePostCloseHref(previousPathname: string | null): string | null {
  if (previousPathname === null) {
    return null
  }

  if (previousPathname === '/auth' || previousPathname.startsWith('/auth/')) {
    return null
  }

  if (previousPathname === '/posts/create') {
    return null
  }

  if (safeExactPathnames.has(previousPathname)) {
    return previousPathname
  }

  if (safePathnamePrefixes.some((prefix) => previousPathname.startsWith(prefix))) {
    return previousPathname
  }

  return null
}
