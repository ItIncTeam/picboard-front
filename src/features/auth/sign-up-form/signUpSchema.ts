import { z } from 'zod'

const passwordComplexityMessage =
  'Password must contain a-z, A-Z, ! " # $ % & \' ( ) * + , - . / : ; < = > ? @ [ \\ ] ^ _ ` { | } ~'

const passwordSpecialCharPattern = /[!-\/:-@\[-`{-~]/

export const signUpSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, { error: 'Username is required' })
      .min(6, { error: 'Minimum number of characters 6' })
      .max(30, { error: 'Maximum number of characters 30' }),
    email: z.string().trim().email({
      error: 'The email must match the format example@example.com',
    }),
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
    agreedToTerms: z.boolean().refine((value) => value === true, {
      error: 'You must agree to the Terms of Service and Privacy Policy',
    }),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    error: 'The passwords must match',
    path: ['passwordConfirmation'],
  })

export type SignUpFormValues = z.infer<typeof signUpSchema>
