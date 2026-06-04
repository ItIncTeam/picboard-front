export type DocModalKind = 'terms' | 'privacy'

type DocModalConfigEntry = {
  title: string
}

export const docModalConfig = {
  privacy: {
    title: 'Privacy Policy',
  },
  terms: {
    title: 'Terms of Service',
  },
} as const satisfies Record<DocModalKind, DocModalConfigEntry>
