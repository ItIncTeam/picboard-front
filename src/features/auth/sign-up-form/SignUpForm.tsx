'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { CloseEyeIcon, OpenEyeIcon } from '@/shared/assets'
import { useI18n } from '@/shared/lib/i18n'
import { useToast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input/Input'
import { Text } from '@/shared/ui/typography'

import { signUp, type SignUpInput } from './api'
import styles from './sign-up-form.module.css'
import { signUpSchema, type SignUpFormValues } from './signUpSchema'

const defaultValues: SignUpFormValues = {
  username: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  agreedToTerms: false,
}

type SignUpFormProps = {
  onOpenPrivacy: () => void
  onOpenTerms: () => void
  onSuccess?: (email: string) => void
}

type BackendFieldError = {
  field: string
  message: string
}

const fallbackErrorMessage = 'Sign up failed. Please try again.'

const fieldMap: Record<string, keyof SignUpFormValues> = {
  acceptPrivacy: 'agreedToTerms',
  acceptTerms: 'agreedToTerms',
  email: 'email',
  password: 'password',
  username: 'username',
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isBackendFieldError = (value: unknown): value is BackendFieldError => {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.message === 'string' &&
    value.message.length > 0
  )
}

const collectFieldErrors = (
  value: unknown,
  result: BackendFieldError[] = [],
): BackendFieldError[] => {
  if (!isRecord(value)) {
    return result
  }

  const errors = value.errors
  const graphQLErrors = value.graphQLErrors

  if (Array.isArray(errors)) {
    errors.forEach((error) => {
      if (isBackendFieldError(error)) {
        result.push(error)
        return
      }

      collectFieldErrors(error, result)
    })
  }

  if (Array.isArray(graphQLErrors)) {
    graphQLErrors.forEach((error) => {
      collectFieldErrors(error, result)
    })
  }

  collectFieldErrors(value.extensions, result)
  collectFieldErrors(value.originalError, result)
  collectFieldErrors(value.networkError, result)
  collectFieldErrors(value.result, result)

  return result
}

const getErrorMessage = (error: unknown): string => {
  if (isRecord(error) && typeof error.message === 'string' && error.message.length > 0) {
    return error.message
  }

  return fallbackErrorMessage
}

const getFieldFromGenericMessage = (message: string): keyof SignUpFormValues | null => {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('username')) {
    return 'username'
  }

  if (normalizedMessage.includes('email')) {
    return 'email'
  }

  return null
}

export function SignUpForm({ onOpenPrivacy, onOpenTerms, onSuccess }: SignUpFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] = useState(false)
  const { t } = useI18n()
  const toast = useToast()

  const {
    clearErrors,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignUpFormValues>({
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onBlur',
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpFormValues) => {
    clearErrors('root')

    try {
      const input: SignUpInput = {
        acceptPrivacy: data.agreedToTerms,
        acceptTerms: data.agreedToTerms,
        email: data.email,
        password: data.password,
        username: data.username,
      }

      await signUp(input)

      onSuccess?.(input.email)
    } catch (error) {
      const fieldErrors = collectFieldErrors(error)

      if (fieldErrors.length === 0) {
        const message = getErrorMessage(error)
        const formField = getFieldFromGenericMessage(message)

        if (formField) {
          setError(formField, { message })
          return
        }

        setError('root', { message })
        toast.error(message)
        return
      }

      let hasUnknownField = false

      fieldErrors.forEach(({ field, message }) => {
        const formField = fieldMap[field]

        if (!formField) {
          hasUnknownField = true
          return
        }

        setError(formField, { message })
      })

      if (hasUnknownField) {
        setError('root', { message: fallbackErrorMessage })
        toast.error(fallbackErrorMessage)
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.fields}>
        <Controller
          name="username"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              autoComplete="username"
              error={fieldState.error?.message}
              label={t.auth.signUp.username}
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              autoComplete="email"
              error={fieldState.error?.message}
              label={t.auth.signUp.email}
              type="email"
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              autoComplete="new-password"
              error={fieldState.error?.message}
              Icon={isPasswordVisible ? CloseEyeIcon : OpenEyeIcon}
              label={t.auth.signUp.password}
              onClick={() => {
                setIsPasswordVisible((currentValue) => !currentValue)
              }}
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
              error={fieldState.error?.message}
              Icon={isPasswordConfirmationVisible ? CloseEyeIcon : OpenEyeIcon}
              label={t.auth.signUp.passwordConfirmation}
              onClick={() => {
                setIsPasswordConfirmationVisible((currentValue) => !currentValue)
              }}
              type={isPasswordConfirmationVisible ? 'text' : 'password'}
              variant="defaultIcon"
            />
          )}
        />
      </div>

      <div className={styles.formActions}>
        {errors.root?.message && (
          <Text className={styles.formError} role="alert" size="sm">
            {errors.root.message}
          </Text>
        )}

        <Controller
          name="agreedToTerms"
          control={control}
          render={({ field, fieldState }) => (
            <div className={styles.termsField}>
              <Checkbox
                checked={field.value}
                errorMessage={fieldState.error ? ' ' : undefined}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true)
                  field.onBlur()
                }}
              />

              <Text className={styles.termsText} size="xs">
                {t.auth.signUp.agreePrefix}{' '}
                <button className={styles.termsLink} onClick={onOpenTerms} type="button">
                  {t.auth.signUp.terms}
                </button>{' '}
                {t.auth.signUp.and}{' '}
                <button className={styles.termsLink} onClick={onOpenPrivacy} type="button">
                  {t.auth.signUp.privacy}
                </button>
              </Text>
            </div>
          )}
        />

        <Button
          className={styles.submitButton}
          disabled={!isValid}
          loading={isSubmitting}
          loadingText={t.auth.signUp.loading}
          type="submit"
        >
          {t.auth.signUp.submit}
        </Button>
      </div>

      <div className={styles.signInFooter}>
        <Text>{t.auth.signUp.signInQuestion}</Text>
        <Link className={styles.signInLink} href="/auth/sign-in">
          {t.auth.signUp.signInLink}
        </Link>
      </div>
    </form>
  )
}
