import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().trim().email({
    error: 'The email must match the format example@example.com',
  }),
  password: z.string().min(1, { error: 'Password is required' }),
})

export type SignInFormValues = z.infer<typeof signInSchema>
