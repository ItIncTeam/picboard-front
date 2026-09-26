'use client'

import { useRouter } from 'next/navigation'

import { CreatePostFlow } from '@/features/create-post'
import { useI18n } from '@/shared/lib/i18n'

import styles from './create-post-page.module.css'

export function CreatePostPage() {
  const router = useRouter()
  const { t } = useI18n()

  const closePage = () => {
    router.replace('/main')
  }

  return (
    <div className={styles.root}>
      <section className={styles.content} aria-labelledby="create-post-title">
        <p className={styles.eyebrow}>{t.routePlaceholder.fallbackEyebrow}</p>
        <h1 className={styles.title} id="create-post-title">
          {t.widgets.createPostModal.title}
        </h1>
        <CreatePostFlow onCloseAction={closePage} />
      </section>
    </div>
  )
}
