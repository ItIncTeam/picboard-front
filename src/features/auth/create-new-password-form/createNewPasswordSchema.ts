import { z } from 'zod'
import { type Dictionary } from '@/shared/lib/i18n/dictionaries'

const passwordSpecialCharPattern = /[!-\/:-@\[-`{-~]/

export const createNewPasswordSchema = (t: Dictionary) =>
  z
    .object({
      password: z
        .string()
        .min(1, { error: t.auth.errors.passwordRequired })
        .superRefine((value, context) => {
          if (value.length < 6) {
            context.addIssue({
              code: 'custom',
              message: t.auth.errors.passwordTooShort,
            })
            return
          }

          if (
            !/[a-z]/.test(value) ||
            !/[A-Z]/.test(value) ||
            !passwordSpecialCharPattern.test(value)
          ) {
            context.addIssue({
              code: 'custom',
              message: t.auth.errors.passwordInvalidChars,
            })
          }
        }),
      passwordConfirmation: z.string().min(1, {
        error: t.auth.errors.passwordConfirm,
      }),
    })
    .refine((values) => values.password === values.passwordConfirmation, {
      error: t.auth.errors.passwordsMismatch,
      path: ['passwordConfirmation'],
    })

export type CreateNewPasswordFormValues = z.infer<ReturnType<typeof createNewPasswordSchema>>
