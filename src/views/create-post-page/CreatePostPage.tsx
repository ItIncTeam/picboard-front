'use client'
import { CreatePostFlow } from '@/features/create-post/create-post-flow'
import { useRouter } from 'next/navigation'
//import { CreatePostFlow } from '@/features/create-post'
import styles from './create-post-page.module.css'

export function CreatePostPage() {
  const router = useRouter()

  const closePage = () => {
    router.replace('/main')
  }

  return (
    <div className={styles.root}>
      <section className={styles.content} aria-labelledby="create-post-title">
        <p className={styles.eyebrow}>Route fallback</p>
        <h1 className={styles.title} id="create-post-title">
          Create post
        </h1>
        <CreatePostFlow onCloseAction={closePage} />
      </section>
    </div>
  )
}
