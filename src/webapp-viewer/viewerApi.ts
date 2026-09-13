export type ViewerApiSettings = {
  provider: 'ordifi' | 'custom'
  baseUrl: string
  token: string
}

const DEFAULT_BASE_URL =
  'https://ordifi.io'

let settings: ViewerApiSettings = {
  provider: 'ordifi',
  baseUrl: DEFAULT_BASE_URL,
  token: '',
}

const ORDIFI_PROTECTED_API_PREFIXES = [
  '/api/viewer/resolve',
  '/api/content-info/',
  '/api/content-spec/',
  '/api/content-summary/',
  '/api/content-composition/',
  '/api/content-offsets/',
  '/api/ord/output/',
]

export function getViewerApiSettings(): ViewerApiSettings {
  return { ...settings }
}

export function setViewerApiSettings(
  next: Partial<ViewerApiSettings>,
) {
  settings = {
    ...settings,
    ...next,
  }
}

function activeToken(): string {
  const configured = settings.token.trim()

  if (configured) {
    return configured
  }

  try {
    return (
      localStorage.getItem(
        'ordifi:viewer-api-token',
      )?.trim() || ''
    )
  } catch {
    return ''
  }
}

function protectedOrdifiPath(
  path: string,
): string {
  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path
  }

  const normalized =
    path.startsWith('/')
      ? path
      : `/${path}`

  if (settings.provider !== 'ordifi') {
    return normalized
  }

  if (
    normalized.startsWith(
      '/api/viewer-api/',
    )
  ) {
    return normalized
  }

  const shouldProtect =
    ORDIFI_PROTECTED_API_PREFIXES.some(
      (prefix) =>
        normalized.startsWith(prefix),
    )

  if (!shouldProtect) {
    return normalized
  }

  return `/api/viewer-api/${
    normalized.slice('/api/'.length)
  }`
}

export function viewerUrl(
  path: string,
): string {
  const resolvedPath =
    protectedOrdifiPath(path)

  if (
    resolvedPath.startsWith('http://') ||
    resolvedPath.startsWith('https://')
  ) {
    return resolvedPath
  }

  return `${settings.baseUrl.replace(/\/+$/, '')}${
    resolvedPath.startsWith('/')
      ? resolvedPath
      : `/${resolvedPath}`
  }`
}

export function viewerApiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers =
    new Headers(init.headers)

  const token = activeToken()

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`,
    )
  }

  return fetch(
    viewerUrl(path),
    {
      ...init,
      headers,
    },
  )
}
