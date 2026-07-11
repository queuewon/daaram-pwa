"use client";

import { computePriceDeltas } from "@/lib/domain/ingredientPricing";
import type { IngredientPriceHistory } from "@/lib/domain/entities";

interface PriceHistoryProps {
  history: IngredientPriceHistory[];
}

function DeltaLabel({
  direction,
  amountKrw,
}: {
  direction: "up" | "down" | "flat" | "first";
  amountKrw: number;
}) {
  if (direction === "first") return <span className="text-sm text-gray-400">최초</span>;
  if (direction === "flat") return <span className="text-sm text-gray-400">-</span>;
  if (direction === "up") {
    return (
      <span className="text-sm font-medium text-danger">▲ {amountKrw.toLocaleString()}원</span>
    );
  }
  return (
    <span className="text-sm font-medium text-price-down">▼ {amountKrw.toLocaleString()}원</span>
  );
}

export default function PriceHistory({ history }: PriceHistoryProps) {
  if (history.length === 0) return null;

  const deltas = computePriceDeltas(history);

  return (
    <section>
      <h2>가격 이력</h2>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
        {history.map((entry, index) => (
          <li key={entry.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <span>{entry.recordedAt}</span>
            <span>{entry.packagePrice.toLocaleString()}원</span>
            <DeltaLabel direction={deltas[index].direction} amountKrw={deltas[index].amountKrw} />
          </li>
        ))}
      </ul>
    </section>
  );
}
