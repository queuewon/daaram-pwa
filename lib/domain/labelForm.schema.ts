import { z } from "zod";

export const labelFormInputSchema = z.object({
  name: z.string().min(1),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type LabelFormInput = z.infer<typeof labelFormInputSchema>;
