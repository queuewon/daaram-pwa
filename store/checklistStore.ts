import { create } from "zustand";
import { db } from "../lib/infra/db";
import type { DailyChecklist } from "../lib/domain/entities";

interface ChecklistStoreState {
  items: DailyChecklist[];
  loadChecklist: () => Promise<void>;
  addChecklistItem: (item: DailyChecklist) => Promise<void>;
}

export const useChecklistStore = create<ChecklistStoreState>((set) => ({
  items: [],
  loadChecklist: async () => {
    const items = await db.daily_checklist.toArray();
    set({ items });
  },
  addChecklistItem: async (item) => {
    await db.daily_checklist.add(item);
    set((state) => ({ items: [...state.items, item] }));
  },
}));
