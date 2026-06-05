'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { CloseEyeIcon, OpenEyeIcon } from '@/shared/assets'
import { setAccessToken } from '@/shared/lib/auth'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input/Input'
import { Text } from '@/shared/ui/typography'

import { signIn } from './api'
import styles from './sign-in-form.module.css'
import { signInSchema, type SignInFormValues } from './signInSchema'

const fallbackErrorMessage = 'Sign in failed. Please try again.'
const invalidCredentialsMessage = 'Incorrect email or password'
const unauthenticatedCode = 'UNAUTHENTICATED'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const hasUnauthenticatedCode = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }

  const code = value.code

  if (code === unauthenticatedCode) {
    return true
  }

  const errors = value.errors
  const graphQLErrors = value.graphQLErrors

  return (
    hasUnauthenticatedCode(value.extensions) ||
    (Array.isArray(errors) && errors.some(hasUnauthenticatedCode)) ||
    (Array.isArray(graphQLErrors) && graphQLErrors.some(hasUnauthenticatedCode))
  )
}

const isInvalidCredentialsError = (error: unknown): boolean => {
  if (hasUnauthenticatedCode(error)) {
    return true
  }

  return error instanceof Error && error.message.toLowerCase().includes('invalid credentials')
}

const defaultValues: SignInFormValues = {
  email: '',
  password: '',
}

type SignInFormProps = {
  onSuccess?: () => void
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const {
    clearErrors,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignInFormValues>({
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onBlur',
    resolver: zodResolver(signInSchema),
  })

  const clearRootError = () => {
    if (errors.root) {
      clearErrors('root')
    }
  }

  const onSubmit = async (data: SignInFormValues) => {
    clearErrors('root')

    try {
      const { accessToken } = await signIn({
        email: data.email,
        password: data.password,
      })

      setAccessToken(accessToken)
      onSuccess?.()
    } catch (error) {
      const message = isInvalidCredentialsError(error)
        ? invalidCredentialsMessage
        : fallbackErrorMessage

      setError('root', { message })
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.fields}>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              autoComplete="email"
              error={fieldState.error?.message}
              label="Email"
              onChange={(event) => {
                clearRootError()
                field.onChange(event)
              }}
              placeholder="Epam@epam.com"
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
              autoComplete="current-password"
              error={fieldState.error?.message}
              Icon={isPasswordVisible ? CloseEyeIcon : OpenEyeIcon}
              label="Password"
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
      </div>

      <div className={styles.forgotPasswordRow}>
        <Text
          as={Link}
          className={styles.forgotPasswordLink}
          color="var(--color-text-secondary)"
          href="/auth/forgot-password"
          size="sm"
          weight="regular"
        >
          Forgot Password
        </Text>
      </div>

      <div className={styles.formActions}>
        {errors.root?.message && (
          <Text className={styles.formError} role="alert" size="sm">
            {errors.root.message}
          </Text>
        )}

        <Button
          className={styles.submitButton}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          loadingText="Signing in..."
          type="submit"
        >
          Sign In
        </Button>
      </div>

      <div className={styles.signUpFooter}>
        <Text color="var(--color-light-100)">Don&apos;t have an account?</Text>
        <Link className={styles.signUpLink} href="/auth/sign-up">
          Sign Up
        </Link>
      </div>
    </form>
  )
}
