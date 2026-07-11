import { z } from "zod";

export const supplierFormInputSchema = z.object({
  name: z.string().min(1),
  contact: z.string(),
  memo: z.string(),
});

export type SupplierFormInput = z.infer<typeof supplierFormInputSchema>;
