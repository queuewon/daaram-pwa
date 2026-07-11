import { create } from "zustand";
import type { z } from "zod";
import { checklistRepository, listChecklistItemsByDate } from "../lib/infra/repositories";
import { checklistFormInputSchema } from "../lib/domain/checklistForm.schema";
import { nextChecklistStatus } from "../lib/domain/checklistStatus";
import { generateId } from "../lib/domain/ids";
import { err, ok, type Result } from "../lib/domain/result";
import type { DailyChecklist } from "../lib/domain/entities";
import type { DailyChecklistId } from "../lib/domain/ids";

export type AddChecklistItemError = { type: "InvalidForm"; issues: z.core.$ZodIssue[] };
export type CycleStatusError = { type: "NotFound"; id: string };

interface ChecklistStoreState {
  items: DailyChecklist[];
  loadByDate: (date: string) => Promise<void>;
  addChecklistItem: (form: unknown) => Promise<Result<DailyChecklist, AddChecklistItemError>>;
  cycleStatus: (id: DailyChecklistId) => Promise<Result<DailyChecklist, CycleStatusError>>;
  removeChecklistItem: (id: DailyChecklistId) => Promise<void>;
}

export const useChecklistStore = create<ChecklistStoreState>((set, get) => ({
  items: [],

  loadByDate: async (date) => {
    const result = await listChecklistItemsByDate(date);
    if (result.ok) set({ items: result.value });
  },

  addChecklistItem: async (form) => {
    const parsed = checklistFormInputSchema.safeParse(form);
    if (!parsed.success) {
      return err({ type: "InvalidForm", issues: parsed.error.issues });
    }

    const item: DailyChecklist = {
      id: generateId<"DailyChecklistId">(),
      recipeId: parsed.data.recipeId,
      date: parsed.data.date,
      batchSize: parsed.data.batchSize,
      status: "pending",
    };
    await checklistRepository.create(item);

    set((state) => ({ items: [...state.items, item] }));
    return ok(item);
  },

  cycleStatus: async (id) => {
    const existing = get().items.find((item) => item.id === id);
    if (!existing) {
      return err({ type: "NotFound", id });
    }

    const updatedItem: DailyChecklist = {
      ...existing,
      status: nextChecklistStatus(existing.status),
    };
    const updateResult = await checklistRepository.update(updatedItem);
    if (!updateResult.ok) {
      return err({ type: "NotFound", id });
    }

    set((state) => ({
      items: state.items.map((item) => (item.id === id ? updatedItem : item)),
    }));
    return ok(updatedItem);
  },

  removeChecklistItem: async (id) => {
    await checklistRepository.remove(id);
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },
}));
