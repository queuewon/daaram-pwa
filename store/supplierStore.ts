import { create } from "zustand";
import type { z } from "zod";
import { supplierRepository } from "../lib/infra/repositories";
import { supplierFormInputSchema } from "../lib/domain/supplierForm.schema";
import { generateId } from "../lib/domain/ids";
import { err, ok, type Result } from "../lib/domain/result";
import type { Supplier } from "../lib/domain/entities";
import type { SupplierId } from "../lib/domain/ids";

export type SaveSupplierError =
  | { type: "InvalidForm"; issues: z.core.$ZodIssue[] }
  | { type: "NotFound"; id: string }
  | { type: "CorruptedRecord"; id: string; issues: z.core.$ZodIssue[] };

export interface SaveSupplierInput {
  supplierId: SupplierId | null;
  form: unknown;
}

interface SupplierStoreState {
  suppliers: Supplier[];
  loadSuppliers: () => Promise<void>;
  saveSupplier: (input: SaveSupplierInput) => Promise<Result<Supplier, SaveSupplierError>>;
  removeSupplier: (id: SupplierId) => Promise<void>;
}

export const useSupplierStore = create<SupplierStoreState>((set) => ({
  suppliers: [],

  loadSuppliers: async () => {
    const result = await supplierRepository.list();
    if (result.ok) set({ suppliers: result.value.items });
  },

  saveSupplier: async ({ supplierId, form }) => {
    const parsed = supplierFormInputSchema.safeParse(form);
    if (!parsed.success) {
      return err({ type: "InvalidForm", issues: parsed.error.issues });
    }

    if (supplierId === null) {
      const supplier: Supplier = {
        id: generateId<"SupplierId">(),
        name: parsed.data.name,
        contact: parsed.data.contact,
        memo: parsed.data.memo,
      };
      await supplierRepository.create(supplier);
      set((state) => ({ suppliers: [...state.suppliers, supplier] }));
      return ok(supplier);
    }

    const existingResult = await supplierRepository.get(supplierId);
    if (!existingResult.ok) return err(existingResult.error);
    if (existingResult.value === null) {
      return err({ type: "NotFound", id: supplierId });
    }

    const updatedSupplier: Supplier = {
      ...existingResult.value,
      name: parsed.data.name,
      contact: parsed.data.contact,
      memo: parsed.data.memo,
    };
    const updateResult = await supplierRepository.update(updatedSupplier);
    if (!updateResult.ok) {
      return err({ type: "NotFound", id: supplierId });
    }

    set((state) => ({
      suppliers: state.suppliers.map((s) => (s.id === supplierId ? updatedSupplier : s)),
    }));
    return ok(updatedSupplier);
  },

  removeSupplier: async (id) => {
    await supplierRepository.remove(id);
    set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
  },
}));
