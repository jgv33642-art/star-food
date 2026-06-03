import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be greater than or equal to 0'),
    cost: z.number().min(0).optional(),
    stockQuantity: z.number().min(0).optional(),
    minimumStock: z.number().min(0).optional(),
    active: z.boolean().optional(),
    sku: z.string().optional().nullable(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    categoryId: z.string().uuid().optional().nullable(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    cost: z.number().min(0).optional(),
    stockQuantity: z.number().min(0).optional(),
    minimumStock: z.number().min(0).optional(),
    active: z.boolean().optional(),
    sku: z.string().optional().nullable(),
  }),
});
