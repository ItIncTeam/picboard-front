import { LegalDocumentBody, privacyParagraphs, termsParagraphs } from '@/shared/content/legal'

import type { DocModalKind } from './docModalConfig'

export function renderDocBody(kind: DocModalKind) {
  const paragraphs = kind === 'terms' ? termsParagraphs : privacyParagraphs

  return <LegalDocumentBody paragraphs={paragraphs} />
}
