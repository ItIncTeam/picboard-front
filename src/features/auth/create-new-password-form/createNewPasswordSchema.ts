import { z } from 'zod'

const passwordComplexityMessage =
  'Password must contain a-z, A-Z, ! " # $ % & \' ( ) * + , - . / : ; < = > ? @ [ \\ ] ^ _ ` { | } ~'

const passwordSpecialCharPattern = /[!-\/:-@\[-`{-~]/

export const createNewPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, { error: 'Password is required' })
      .superRefine((value, context) => {
        if (value.length < 6) {
          context.addIssue({
            code: 'custom',
            message: 'Minimum number of characters 6',
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
            message: passwordComplexityMessage,
          })
        }
      }),
    passwordConfirmation: z.string().min(1, {
      error: 'Confirm your password',
    }),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    error: 'The passwords must match',
    path: ['passwordConfirmation'],
  })

export type CreateNewPasswordFormValues = z.infer<typeof createNewPasswordSchema>
