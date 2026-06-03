'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { CloseEyeIcon, OpenEyeIcon } from '@/shared/assets'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input/Input'
import { Text } from '@/shared/ui/typography'

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
  onSuccess?: () => void
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<SignUpFormValues>({
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onBlur',
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      // TODO: replace with sign-up API call; remove debug log when wired.
      console.warn('Sign up form data:', data)

      onSuccess?.()
    } catch (error) {
      // TODO: map API errors to form fields or show a global error message.
      console.error('Sign up failed:', error)
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
              label="Username"
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
              label="Email"
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
              label="Password"
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
              label="Password confirmation"
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
        <Controller
          name="agreedToTerms"
          control={control}
          render={({ field, fieldState }) => (
            <div className={styles.termsField}>
              <Checkbox
                checked={field.value}
                className={styles.termsCheckbox}
                controlClassName={styles.termsCheckboxControl}
                errorMessage={fieldState.error?.message}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true)
                  field.onBlur()
                }}
              />

              <div className={styles.termsLabel}>
                <Text as="span" color="var(--color-light-100)" size="xs">
                  I agree to the{' '}
                  <Link className={styles.termsLink} href="/terms">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link className={styles.termsLink} href="/privacy-policy">
                    Privacy Policy
                  </Link>
                </Text>
              </div>
            </div>
          )}
        />

        <Button className={styles.submitButton} disabled={!isValid || isSubmitting} type="submit">
          Sign Up
        </Button>
      </div>

      <div className={styles.signInFooter}>
        <Text color="var(--color-light-100)">Do you have an account?</Text>
        <Link className={styles.signInLink} href="/auth/sign-in">
          Sign In
        </Link>
      </div>
    </form>
  )
}
