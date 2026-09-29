import {
  LegalDocumentBody,
  privacyParagraphsByLanguage,
  termsParagraphsByLanguage,
} from '@/shared/content/legal'
import type { Language } from '@/shared/lib/i18n'

import type { DocModalKind } from './docModalConfig'

export function renderDocBody(kind: DocModalKind, language: Language) {
  const paragraphs =
    kind === 'terms' ? termsParagraphsByLanguage[language] : privacyParagraphsByLanguage[language]

  return <LegalDocumentBody paragraphs={paragraphs} />
}
