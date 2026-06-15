'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import NextLink from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { setNewPassword } from '@/features/auth/api/passwordRecoveryApi'
import { CloseEyeIcon, OpenEyeIcon } from '@/shared/assets'
import { authRoutes } from '@/shared/lib/auth'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Text } from '@/shared/ui/typography'

import styles from './create-new-password-form.module.css'
import {
  createNewPasswordSchema,
  type CreateNewPasswordFormValues,
} from './createNewPasswordSchema'

const defaultValues: CreateNewPasswordFormValues = {
  password: '',
  passwordConfirmation: '',
}

const redirectDelayMs = 3000

export function CreateNewPasswordForm() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = useMemo(() => searchParams.get('code')?.trim() ?? '', [searchParams])
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const schema = useMemo(() => createNewPasswordSchema(t), [t])

  const {
    clearErrors,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateNewPasswordFormValues>({
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onBlur',
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!successMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      router.push(authRoutes.signIn)
    }, redirectDelayMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [router, successMessage])

  const getErrorMessage = (error: unknown): string => {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : t.auth.createNewPassword.fallbackError
  }

  const clearRootError = (): void => {
    if (errors.root) {
      clearErrors('root')
    }
  }

  const onSubmit = async (data: CreateNewPasswordFormValues): Promise<void> => {
    if (!code) {
      return
    }

    clearErrors('root')

    try {
      await setNewPassword({
        code,
        password: data.password,
      })

      setSuccessMessage(t.auth.createNewPassword.successMessage)
    } catch (error) {
      setError('root', { message: getErrorMessage(error) })
    }
  }

  if (!code) {
    return (
      <div className={styles.state}>
        <Text aria-live="polite" className={styles.stateMessage} color="var(--color-status-danger)">
          {t.auth.createNewPassword.invalidLink}
        </Text>
        <Button asChild className={styles.submitButton}>
          <NextLink href={authRoutes.forgotPassword}>
            {t.auth.createNewPassword.requestPasswordReset}
          </NextLink>
        </Button>
      </div>
    )
  }

  if (successMessage) {
    return (
      <div className={styles.state}>
        <Text aria-live="polite" className={styles.success} role="status">
          {successMessage}
        </Text>
        <Button asChild className={styles.submitButton}>
          <NextLink href={authRoutes.signIn}>{t.auth.createNewPassword.signIn}</NextLink>
        </Button>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.fields}>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              autoComplete="new-password"
              disabled={isSubmitting}
              error={fieldState.error?.message}
              Icon={isPasswordVisible ? CloseEyeIcon : OpenEyeIcon}
              label={t.auth.createNewPassword.newPassword}
              onChange={(event) => {
                clearRootError()
                field.onChange(event)
              }}
              onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
              placeholder="••••••••"
              type={isPasswordVisible ? 'text' : 'password'}
              variant="defaultIcon"
            />
          )}
        />

        <Controller
          name="passwordConfirmation"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              autoComplete="new-password"
              disabled={isSubmitting}
              error={fieldState.error?.message}
              Icon={isPasswordConfirmationVisible ? CloseEyeIcon : OpenEyeIcon}
              label={t.auth.createNewPassword.passwordConfirmation}
              onChange={(event) => {
                clearRootError()
                field.onChange(event)
              }}
              onClick={() => setIsPasswordConfirmationVisible((currentValue) => !currentValue)}
              placeholder="••••••••"
              type={isPasswordConfirmationVisible ? 'text' : 'password'}
              variant="defaultIcon"
            />
          )}
        />
      </div>

      <Text className={styles.requirement} size="sm">
        {t.auth.createNewPassword.passwordRequirement}
      </Text>

      <div className={styles.formActions}>
        {errors.root?.message && (
          <Text className={styles.formError} role="alert" size="sm">
            {errors.root.message}
          </Text>
        )}

        <Button
          className={styles.submitButton}
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingText={t.auth.createNewPassword.saving}
          type="submit"
        >
          {t.auth.createNewPassword.submit}
        </Button>
      </div>
    </form>
  )
}
