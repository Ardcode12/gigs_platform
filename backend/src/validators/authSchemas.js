import { z } from 'zod';

const email = z
  .string({ required_error: 'Email is required.' })
  .trim()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.')
  .toLowerCase();

/**
 * Password policy for authority officers: length plus three character classes.
 * Applied on the way in (reset / change), not at login -- an existing password
 * must still be accepted verbatim so the rule can tighten later without
 * locking anyone out.
 */
const strongPassword = z
  .string({ required_error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be 72 characters or fewer.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[0-9]/, 'Password must include a number.');

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Password is required.' }).min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    accessToken: z.string().min(1, 'This reset link is missing its token.'),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, 'Please confirm the new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Your current password is required.'),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, 'Please confirm the new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'The new password must be different from the current one.',
  });

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'A refresh token is required.'),
});
