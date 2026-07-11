"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useChecklistStore } from "@/store/checklistStore";
import { calculateChecklistProgress } from "@/lib/domain/checklistProgress";
import { todayDateString } from "@/lib/domain/date";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

const SHORTCUT_BUTTON_CLASS =
  "inline-block rounded border border-gray-400 px-3 py-1 hover:bg-gray-100";

export default function HomePage() {
  const items = useChecklistStore((s) => s.items);
  const loadByDate = useChecklistStore((s) => s.loadByDate);

  useEffect(() => {
    loadByDate(todayDateString());
  }, [loadByDate]);

  const progress = calculateChecklistProgress(items);

  return (
    <main>
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xl font-bold">Indigo Gelato</p>
          <p className="text-sm text-gray-500">Recipe Manager</p>
        </div>
        <Image
          src="/brand/indigo-gelato-heart.jpg"
          alt="Indigo Gelato"
          width={48}
          height={48}
          className="rounded-full object-cover"
        />
      </header>

      <div>
        <p className="text-lg font-semibold">안녕, 누나!</p>
        <p className="text-sm text-gray-500">오늘도 맛있는 젤라또 만들자!</p>
      </div>

      <Card accent="data">
        <h2>오늘 생산</h2>
        {progress.total === 0 ? (
          <div className="space-y-3">
            <EmptyState
              title="오늘 등록된 생산 항목이 없습니다"
              subtitle="아래 버튼으로 메뉴를 추가해 보세요"
            />
            <Link href="/checklist" className={SHORTCUT_BUTTON_CLASS}>
              메뉴 추가하기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-semibold">
              {progress.doneCount.toLocaleString()} / {progress.total.toLocaleString()} 완료
            </p>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-data"
                style={{ width: `${progress.ratio * 100}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/recipes">
          <Card accent="brand" className="text-center">
            레시피
          </Card>
        </Link>
        <Link href="/ingredients">
          <Card accent="ingredient" className="text-center">
            재료
          </Card>
        </Link>
        <Link href="/checklist">
          <Card accent="data" className="text-center">
            오늘 생산
          </Card>
        </Link>
      </div>
    </main>
  );
}
