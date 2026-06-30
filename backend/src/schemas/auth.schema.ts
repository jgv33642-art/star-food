import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'Company name is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'Company name is required'),
    userName: z.string().min(2, 'User name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});
