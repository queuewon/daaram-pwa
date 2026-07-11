"use client";

import type { IngredientPriceHistory } from "@/lib/domain/entities";

interface PriceHistoryProps {
  history: IngredientPriceHistory[];
}

export default function PriceHistory({ history }: PriceHistoryProps) {
  if (history.length === 0) return null;

  return (
    <section>
      <h2>가격 이력</h2>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
        {history.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <span>{entry.recordedAt}</span>
            <span>
              {entry.packagePrice.toLocaleString()}원 / {entry.packageAmount.toLocaleString()}g
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
