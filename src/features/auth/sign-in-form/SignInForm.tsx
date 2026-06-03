'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { CloseEyeIcon, OpenEyeIcon } from '@/shared/assets'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input/Input'
import { Text } from '@/shared/ui/typography'

import styles from './sign-in-form.module.css'
import { signInSchema, type SignInFormValues } from './signInSchema'

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
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<SignInFormValues>({
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onBlur',
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInFormValues) => {
    try {
      // TODO: replace with sign-in API call; remove debug log when wired.
      console.warn('Sign in form data:', data)
      onSuccess?.()
    } catch (error) {
      // TODO: map API errors to form fields or show a global error message.
      console.error('Sign in failed:', error)
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
        <Button className={styles.submitButton} disabled={!isValid || isSubmitting} type="submit">
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
