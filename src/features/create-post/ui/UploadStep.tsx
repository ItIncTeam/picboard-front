import { Button } from '@/shared/ui/button'
import { Text } from '@/shared/ui/typography'

import styles from './upload-step.module.css'

export function UploadStep() {
  return (
    <section className={styles.root} aria-label="Upload photo">
      <div className={styles.placeholder} aria-hidden>
        <div className={styles.icon}>
          <span className={styles.iconSky} />
          <span className={styles.iconSun} />
          <span className={styles.iconMountainPrimary} />
          <span className={styles.iconMountainSecondary} />
        </div>
      </div>

      <div className={styles.content}>
        <Text as="p" className={styles.caption} size="md">
          Add photos for your new publication
        </Text>
        <Button className={styles.button} type="button">
          Select from Computer
        </Button>
      </div>
    </section>
  )
}
