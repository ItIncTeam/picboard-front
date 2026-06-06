import styles from './select.module.css'

type SelectOptionImageProps = {
  src: string
  alt?: string
}

export const SelectOptionImage = ({ src, alt }: SelectOptionImageProps) => {
  if (alt) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- shared kit: small flag images, no next/image
      <img src={src} alt={alt} className={styles['select__image']} width={24} height={16} />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- shared kit: decorative flag when label is present
    <img src={src} alt="" className={styles['select__image']} width={24} height={16} aria-hidden />
  )
}
