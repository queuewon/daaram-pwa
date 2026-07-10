import { create } from "zustand";
import { checklistRepository } from "../lib/infra/repositories";
import type { DailyChecklist } from "../lib/domain/entities";

interface ChecklistStoreState {
  items: DailyChecklist[];
  loadChecklist: () => Promise<void>;
  addChecklistItem: (item: DailyChecklist) => Promise<void>;
}

export const useChecklistStore = create<ChecklistStoreState>((set) => ({
  items: [],
  loadChecklist: async () => {
    const result = await checklistRepository.list();
    if (result.ok) set({ items: result.value.items });
  },
  addChecklistItem: async (item) => {
    await checklistRepository.create(item);
    set((state) => ({ items: [...state.items, item] }));
  },
}));
