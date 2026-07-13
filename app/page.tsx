"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useChecklistStore } from "@/store/checklistStore";
import { calculateChecklistProgress } from "@/lib/domain/checklistProgress";
import { todayDateString } from "@/lib/domain/date";
import { Card, type CardAccent } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { TONE_DOT, TONE_SOFT_BG } from "@/components/ui/theme";

interface Shortcut {
  href: string;
  title: string;
  subtitle: string;
  accent: Exclude<CardAccent, "neutral">;
}

const SHORTCUTS: readonly Shortcut[] = [
  { href: "/recipes", title: "레시피 목록", subtitle: "등록된 젤라또", accent: "brand" },
  { href: "/ingredients", title: "재료 관리", subtitle: "가격 & 재고", accent: "ingredient" },
  { href: "/checklist", title: "오늘 생산", subtitle: "체크리스트", accent: "data" },
];

export default function HomePage() {
  const items = useChecklistStore((s) => s.items);
  const loadByDate = useChecklistStore((s) => s.loadByDate);

  useEffect(() => {
    loadByDate(todayDateString());
  }, [loadByDate]);

  const progress = calculateChecklistProgress(items);

  return (
    <main>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-brand">Indigo Gelato</p>
          <p className="text-sm text-gray-500">Recipe Manager</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/indigo-gelato-heart.jpg"
          alt="Indigo Gelato"
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      </header>

      <div className="space-y-1">
        <p className="text-xl font-bold text-gray-900">안녕, 누나!</p>
        <p className="text-sm text-gray-500">
          오늘도 맛있는 젤라또 만들자! (김경원이 만들어준 어플 ^^b)
        </p>
      </div>

      <Card accent="data" className="space-y-4">
        <SectionTitle
          tone="data"
          action={
            <span className="text-sm font-medium text-gray-500">
              {progress.doneCount.toLocaleString()} / {progress.total.toLocaleString()} 완료
            </span>
          }
        >
          오늘 생산할 메뉴
        </SectionTitle>
        <div className="h-2 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-data transition-all"
            style={{ width: `${progress.ratio * 100}%` }}
          />
        </div>
        {progress.total === 0 && (
          <div className="flex flex-col items-center gap-3 pt-2 text-center">
            <p className="text-sm text-gray-500">오늘 만들 메뉴가 없네... 까먹은거 아니지?</p>
            <Link href="/checklist">
              <Button tone="data" variant="soft">
                메뉴 추가하기
              </Button>
            </Link>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <SectionTitle tone="brand">바로가기</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {SHORTCUTS.map((shortcut) => (
            <Link key={shortcut.href} href={shortcut.href} className="block">
              <Card accent={shortcut.accent} className="flex h-full flex-col gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${TONE_SOFT_BG[shortcut.accent]}`}
                >
                  <span className={`h-4 w-4 rounded-full ${TONE_DOT[shortcut.accent]}`} />
                </span>
                <div>
                  <p className="font-bold text-gray-900">{shortcut.title}</p>
                  <p className="text-sm text-gray-500">{shortcut.subtitle}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
