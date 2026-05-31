'use client'

import { useId, type ChangeEvent } from 'react'

import { cn } from '@/shared/lib/cn'

import styles from './recaptcha.module.css'

export type RecaptchaStatus = 'default' | 'hover' | 'checked' | 'loading' | 'error' | 'expired'

type RecaptchaProps = {
  checked?: boolean
  className?: string
  defaultChecked?: boolean
  disabled?: boolean
  errorMessage?: string
  expiredMessage?: string
  onCheckedChange?: (checked: boolean) => void
  status?: RecaptchaStatus
}

export function Recaptcha({
  checked,
  className,
  defaultChecked,
  disabled = false,
  errorMessage = 'Please verify that you are not a robot',
  expiredMessage = 'Verifiction expired. Check the checkbox again.',
  onCheckedChange,
  status = 'default',
}: RecaptchaProps) {
  const controlId = useId()
  const messageId = useId()
  const isChecked = status === 'checked'
  const isError = status === 'error'
  const isExpired = status === 'expired'
  const isLoading = status === 'loading'
  const hasFixedStatus = status !== 'default' && status !== 'hover'
  const isDisabled = disabled || isLoading
  const describedBy = isError || isExpired ? messageId : undefined
  const checkedValue = hasFixedStatus ? isChecked : checked
  const defaultCheckedValue = hasFixedStatus || checked !== undefined ? undefined : defaultChecked

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(event.currentTarget.checked)
  }

  return (
    <fieldset
      className={cn(
        styles.recaptcha,
        isError && styles['recaptcha--error'],
        isExpired && styles['recaptcha--expired'],
        className,
      )}
    >
      <legend className={styles.recaptcha__legend}>reCAPTCHA verification</legend>

      <div
        className={cn(
          styles.recaptcha__card,
          status === 'hover' && styles['recaptcha__card--hover'],
        )}
      >
        <div className={styles.recaptcha__verification}>
          <input
            aria-busy={isLoading || undefined}
            aria-describedby={describedBy}
            aria-invalid={isError || undefined}
            checked={checkedValue}
            className={styles.recaptcha__input}
            defaultChecked={defaultCheckedValue}
            disabled={isDisabled}
            id={controlId}
            onChange={handleChange}
            readOnly={hasFixedStatus && onCheckedChange === undefined}
            type="checkbox"
          />

          <label className={styles.recaptcha__control} htmlFor={controlId}>
            <RecaptchaCheckIcon />
            {isLoading && <RecaptchaSpinner />}
          </label>

          <div className={styles['recaptcha__label-group']}>
            {isExpired && (
              <p className={styles.recaptcha__expired} id={messageId}>
                {expiredMessage}
              </p>
            )}

            <label
              className={cn(
                styles.recaptcha__label,
                isDisabled && styles['recaptcha__label--disabled'],
              )}
              htmlFor={controlId}
            >
              I&apos;m not a robot
            </label>
          </div>
        </div>

        <div className={styles.recaptcha__brand} aria-hidden>
          <RecaptchaLogo />
          <span className={styles['recaptcha__brand-name']}>reCAPTCHA</span>
          <span className={styles['recaptcha__brand-links']}>Privacy - Terms</span>
        </div>
      </div>

      {isError && (
        <p className={styles.recaptcha__error} id={messageId}>
          {errorMessage}
        </p>
      )}
    </fieldset>
  )
}

function RecaptchaSpinner() {
  return (
    <svg
      className={styles.recaptcha__spinner}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className={styles['recaptcha__spinner-track']}
        cx="10"
        cy="10"
        fill="none"
        r="7"
        stroke="currentColor"
      />
      <circle
        className={styles['recaptcha__spinner-arc']}
        cx="10"
        cy="10"
        fill="none"
        r="7"
        stroke="currentColor"
      />
    </svg>
  )
}

function RecaptchaCheckIcon() {
  return (
    <svg className={styles.recaptcha__check} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 19">
      <path
        fill="#19983b"
        fillOpacity=".902"
        d="M22.036 0c.775.745 1.533 1.51 2.303 2.262v.001q-8 7.996-16.005 15.988L.014 9.915 0 9.916v-.015c.066.015.065-.11.127-.128.715-.716 1.425-1.437 2.14-2.152q3.035 3.032 6.068 6.066Q15.189 6.847 22.035 0"
      />
    </svg>
  )
}

function RecaptchaLogo() {
  const iconId = useId().replace(/:/g, '')
  const filterAId = `${iconId}-a`
  const filterBId = `${iconId}-b`
  const filterCId = `${iconId}-c`

  return (
    <svg
      className={styles.recaptcha__logo}
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="31"
      fill="none"
      viewBox="0 0 30 31"
    >
      <g filter={`url(#${filterAId})`}>
        <path
          fill="#b5b6b5"
          d="m26.44 24.507-5.084-4.576c-1.017 1.017-2.542 3.05-6.61 3.05s-5.593-2.033-7.119-3.559l3.56-4.068H0v12.204l3.05-3.051c1.526 1.525 6 5.593 11.696 5.593s10-3.898 11.695-5.593"
        />
      </g>
      <g filter={`url(#${filterBId})`}>
        <path
          fill="#4d8df4"
          d="m14.237 12.304-3.559-4.068c-3.56 2.034-4.237 5.593-4.068 7.118H0c0-1.017.098-4.312 1.017-6.61 1.017-2.542 3.22-4.237 4.576-5.085L2.543.1h11.694z"
        />
      </g>
      <g filter={`url(#${filterCId})`}>
        <path
          fill="#1b3cac"
          d="m18.305 14.846 3.56-3.56C19.83 7.728 15.931 7.22 14.236 7.22V.1c1.526 0 5.594.509 7.627 2.034 1.898 1.423 3.39 3.05 4.068 4.068l3.56-3.051v11.695z"
        />
      </g>
      <path
        stroke="#000"
        strokeWidth=".2"
        d="m18.305 14.846 3.56-3.56C19.83 7.728 15.931 7.22 14.236 7.22V.1c1.526 0 5.594.509 7.627 2.034 1.898 1.423 3.39 3.05 4.068 4.068l3.56-3.051v11.695z"
      />
      <defs>
        <filter
          id={filterAId}
          width="27.441"
          height="15.746"
          x="0"
          y="14.354"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="1" dy="-1" />
          <feGaussianBlur stdDeviation=".5" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.2 0" />
          <feBlend in2="shape" result="effect1_innerShadow_3663_9430" />
        </filter>
        <filter
          id={filterBId}
          width="15.237"
          height="16.254"
          x="0"
          y="-.9"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="1" dy="-1" />
          <feGaussianBlur stdDeviation=".5" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend in2="shape" result="effect1_innerShadow_3663_9430" />
        </filter>
        <filter
          id={filterCId}
          width="16.454"
          height="15.946"
          x="14.137"
          y="-1"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="1" dy="-1" />
          <feGaussianBlur stdDeviation=".5" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend in2="shape" result="effect1_innerShadow_3663_9430" />
        </filter>
      </defs>
    </svg>
  )
}
