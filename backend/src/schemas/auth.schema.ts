import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'O nome do estabelecimento é obrigatório e deve ter no mínimo 2 letras.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'O nome do estabelecimento é obrigatório.'),
    userName: z.string().min(2, 'O seu nome é obrigatório.'),
    email: z.string().email('O e-mail digitado não é válido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  }),
});
