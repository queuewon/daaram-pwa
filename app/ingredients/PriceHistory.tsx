"use client";

import { computePriceDeltas } from "@/lib/domain/ingredientPricing";
import type { IngredientPriceHistory } from "@/lib/domain/entities";

interface PriceHistoryProps {
  history: IngredientPriceHistory[];
  /** Render only the list card, without the "가격 이력" heading/section wrapper. */
  bare?: boolean;
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
      <span className="text-sm font-semibold text-danger">▲ {amountKrw.toLocaleString()}</span>
    );
  }
  return (
    <span className="text-sm font-semibold text-price-down">▼ {amountKrw.toLocaleString()}</span>
  );
}

export default function PriceHistory({ history, bare = false }: PriceHistoryProps) {
  if (history.length === 0) return null;

  const deltas = computePriceDeltas(history);

  const list = (
    <ul className="divide-y divide-amber-100 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      {history.map((entry, index) => (
        <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{entry.recordedAt}</p>
            <p className="mt-0.5 font-semibold text-gray-900">
              {entry.packagePrice.toLocaleString()}원 / {entry.packageAmount.toLocaleString()}g
            </p>
          </div>
          <DeltaLabel direction={deltas[index].direction} amountKrw={deltas[index].amountKrw} />
        </li>
      ))}
    </ul>
  );

  if (bare) return list;

  return (
    <section>
      <h2>가격 이력</h2>
      {list}
    </section>
  );
}
