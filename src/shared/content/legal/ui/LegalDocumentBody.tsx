import { Text } from '@/shared/ui/typography'

import styles from './legal-document-body.module.css'

type LegalDocumentBodyProps = {
  paragraphs: readonly string[]
}

export function LegalDocumentBody({ paragraphs }: LegalDocumentBodyProps) {
  return (
    <div className={styles.body}>
      {paragraphs.map((paragraph, index) => (
        <Text key={index} className={styles.paragraph} size="sm">
          {paragraph}
        </Text>
      ))}
    </div>
  )
}
