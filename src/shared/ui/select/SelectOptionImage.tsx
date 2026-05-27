import styles from './select.module.css'

type SelectOptionImageProps = {
  src: string
}

export const SelectOptionImage = ({ src }: SelectOptionImageProps) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- shared kit: small decorative flag images, no next/image
    <img src={src} alt="" className={styles['select__image']} width={24} height={16} aria-hidden />
  )
}
