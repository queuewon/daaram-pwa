"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/domain/date";
import type { IngredientPriceHistory } from "@/lib/domain/entities";

interface PriceHistoryProps {
  history: IngredientPriceHistory[];
  /** 표시할 최대 개수(변경 비교는 항상 바로 이전 항목과 한다). */
  limit?: number;
  onRestore?: (entry: IngredientPriceHistory) => void;
  restoreLabel?: string;
  /** 카드 목록만 렌더(제목/섹션 래퍼 없이). */
  bare?: boolean;
}

export default function PriceHistory({
  history,
  limit,
  onRestore,
  restoreLabel = "복원",
  bare = false,
}: PriceHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) return null;

  const hasMore = limit !== undefined && history.length > limit;
  const visibleCount = limit === undefined || expanded ? history.length : limit;

  const list = (
    <div className="space-y-3">
      <ul className="space-y-3">
        {history.slice(0, visibleCount).map((entry, index) => {
          const isCurrent = index === 0;
          const older = history[index + 1];
          const priceChanged = older !== undefined && entry.packagePrice !== older.packagePrice;
          const amountChanged = older !== undefined && entry.packageAmount !== older.packageAmount;
          const priceUp = older !== undefined && entry.packagePrice > older.packagePrice;
          return (
            <li key={entry.id}>
              <div className="space-y-2 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">
                      {entry.packagePrice.toLocaleString()}원 /{" "}
                      {entry.packageAmount.toLocaleString()}g
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-ingredient-soft px-2 py-0.5 text-xs font-bold text-ingredient">
                        현재
                      </span>
                    )}
                  </div>
                  {onRestore && !isCurrent && (
                    <Button
                      type="button"
                      tone="ingredient"
                      variant="soft"
                      onClick={() => onRestore(entry)}
                    >
                      {restoreLabel}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-400">{formatDateTime(entry.recordedAt)}</p>

                {older === undefined ? (
                  <p className="border-t border-amber-100 pt-2 text-sm text-gray-400">최초 등록</p>
                ) : (
                  <div className="space-y-1 border-t border-amber-100 pt-2 text-sm">
                    {priceChanged && (
                      <p className="flex flex-wrap items-center gap-x-2">
                        <span className="text-gray-500">가격</span>
                        <span className="text-gray-400 line-through">
                          {older.packagePrice.toLocaleString()}원
                        </span>
                        <span className="text-gray-400">→</span>
                        <span
                          className={`font-medium ${priceUp ? "text-danger" : "text-price-down"}`}
                        >
                          {entry.packagePrice.toLocaleString()}원
                        </span>
                      </p>
                    )}
                    {amountChanged && (
                      <p className="flex flex-wrap items-center gap-x-2">
                        <span className="text-gray-500">중량</span>
                        <span className="text-gray-400 line-through">
                          {older.packageAmount.toLocaleString()}g
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-gray-800">
                          {entry.packageAmount.toLocaleString()}g
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full rounded-full border-transparent bg-ingredient-soft py-2 text-sm font-semibold text-ingredient hover:brightness-95"
        >
          {expanded ? "접기" : `더 보기 (${history.length - (limit ?? 0)}개)`}
        </button>
      )}
    </div>
  );

  if (bare) return list;

  return (
    <section>
      <h2>수정 이력</h2>
      {list}
    </section>
  );
}
