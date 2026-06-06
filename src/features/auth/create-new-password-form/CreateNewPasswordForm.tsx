'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import NextLink from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { setNewPassword } from '@/features/auth/api/passwordRecoveryApi'
import { CloseEyeIcon, OpenEyeIcon } from '@/shared/assets'
import { authRoutes } from '@/shared/lib/auth'
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

const fallbackErrorMessage = 'Password update failed. Please try again.'
const passwordRequirement = 'Your password must be between 6 and 20 characters'
const redirectDelayMs = 3000

const getErrorMessage = (error: unknown) => {
  return error instanceof Error && error.message.length > 0 ? error.message : fallbackErrorMessage
}

export function CreateNewPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = useMemo(() => searchParams.get('code')?.trim() ?? '', [searchParams])
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
    resolver: zodResolver(createNewPasswordSchema),
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

  const clearRootError = () => {
    if (errors.root) {
      clearErrors('root')
    }
  }

  const onSubmit = async (data: CreateNewPasswordFormValues) => {
    if (!code) {
      return
    }

    clearErrors('root')

    try {
      await setNewPassword({
        code,
        password: data.password,
      })

      setSuccessMessage('Password has been changed successfully!')
    } catch (error) {
      setError('root', { message: getErrorMessage(error) })
    }
  }

  if (!code) {
    return (
      <div className={styles.state}>
        <Text aria-live="polite" className={styles.stateMessage} color="var(--color-status-danger)">
          Invalid recovery link. Please request a new password reset.
        </Text>
        <Button asChild className={styles.submitButton}>
          <NextLink href={authRoutes.forgotPassword}>Request Password Reset</NextLink>
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
          <NextLink href={authRoutes.signIn}>Sign In</NextLink>
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
              label="New password"
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
              label="Password confirmation"
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
        {passwordRequirement}
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
          loadingText="Saving..."
          type="submit"
        >
          Create new password
        </Button>
      </div>
    </form>
  )
}
