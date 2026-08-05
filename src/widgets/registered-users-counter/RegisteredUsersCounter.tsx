import styles from './registered-users-counter.module.css'

type RegisteredUsersCounterProps = {
  usersCount: number
}

const MINIMUM_DIGIT_COUNT = 6

export function RegisteredUsersCounter({ usersCount }: RegisteredUsersCounterProps) {
  const safeUsersCount = Math.max(0, Math.trunc(usersCount))
  const digits = String(safeUsersCount).padStart(MINIMUM_DIGIT_COUNT, '0').split('')

  return (
    <div className={styles.counter} aria-label={`${safeUsersCount} registered users`}>
      <span className={styles.label}>Registered users:</span>
      <span className={styles.digits} aria-hidden>
        {digits.map((digit, index) => (
          <span className={styles.digit} key={`${index}-${digit}`}>
            {digit}
          </span>
        ))}
      </span>
    </div>
  )
}
