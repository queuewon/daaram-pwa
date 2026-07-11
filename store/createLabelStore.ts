import { create, type StoreApi, type UseBoundStore } from "zustand";
import type { IndexableType } from "dexie";
import type { z } from "zod";
import { labelFormInputSchema } from "../lib/domain/labelForm.schema";
import { err, ok, type Result } from "../lib/domain/result";
import type { Repository } from "../lib/infra/repository";

export type SaveLabelError =
  | { type: "InvalidForm"; issues: z.core.$ZodIssue[] }
  | { type: "NotFound"; id: string }
  | { type: "CorruptedRecord"; id: string; issues: z.core.$ZodIssue[] };

interface Label<TId> {
  id: TId;
  name: string;
  colorHex: string;
}

export interface SaveLabelInput<TId> {
  id: TId | null;
  form: unknown;
}

export interface LabelStoreState<L extends Label<TId>, TId extends IndexableType> {
  items: L[];
  loadItems: () => Promise<void>;
  saveLabel: (input: SaveLabelInput<TId>) => Promise<Result<L, SaveLabelError>>;
  removeLabel: (id: TId) => Promise<void>;
}

export function createLabelStore<L extends Label<TId>, TId extends IndexableType>(
  repository: Repository<L, TId>,
  generateLabelId: () => TId,
): UseBoundStore<StoreApi<LabelStoreState<L, TId>>> {
  return create<LabelStoreState<L, TId>>((set) => ({
    items: [],

    loadItems: async () => {
      const result = await repository.list();
      if (result.ok) set({ items: result.value.items });
    },

    saveLabel: async ({ id, form }) => {
      const parsed = labelFormInputSchema.safeParse(form);
      if (!parsed.success) {
        return err({ type: "InvalidForm", issues: parsed.error.issues });
      }

      if (id === null) {
        const label = {
          id: generateLabelId(),
          name: parsed.data.name,
          colorHex: parsed.data.colorHex,
        } as L;
        await repository.create(label);
        set((state) => ({ items: [...state.items, label] }));
        return ok(label);
      }

      const existingResult = await repository.get(id);
      if (!existingResult.ok) return err(existingResult.error);
      if (existingResult.value === null) {
        return err({ type: "NotFound", id: String(id) });
      }

      const updatedLabel = {
        ...existingResult.value,
        name: parsed.data.name,
        colorHex: parsed.data.colorHex,
      };
      const updateResult = await repository.update(updatedLabel);
      if (!updateResult.ok) {
        return err({ type: "NotFound", id: String(id) });
      }

      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedLabel : item)),
      }));
      return ok(updatedLabel);
    },

    removeLabel: async (id) => {
      await repository.remove(id);
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    },
  }));
}
