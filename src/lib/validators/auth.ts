import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
