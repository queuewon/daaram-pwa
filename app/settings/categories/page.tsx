"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, type CardAccent } from "@/components/ui/Card";
import { TONE_TEXT } from "@/components/ui/theme";

type FilledAccent = Exclude<CardAccent, "neutral">;

const PILL_BG: Record<FilledAccent, string> = {
  brand: "bg-pink-200",
  ingredient: "bg-amber-200",
  data: "bg-blue-200",
};

interface CategoryEntry {
  href: string;
  title: string;
  subtitle: string;
  accent: FilledAccent;
}

const ENTRIES: readonly CategoryEntry[] = [
  {
    href: "/settings/categories/recipe",
    title: "레시피 카테고리",
    subtitle: "과일, 차, 곡물 등 레시피를 분류하기",
    accent: "brand",
  },
  {
    href: "/settings/categories/ingredient",
    title: "재료 카테고리",
    subtitle: "유제품, 견과 등 재료를 묶기",
    accent: "ingredient",
  },
  {
    href: "/settings/categories/package-unit",
    title: "포장 단위",
    subtitle: "개, 봉, 통 같은 단위를 관리하기",
    accent: "data",
  },
];

export default function CategoriesPage() {
  return (
    <main>
      <PageHeader title="카테고리 관리" tone="neutral" back />

      <Card accent="neutral" className="space-y-1">
        <p className="font-bold text-gray-900">라벨을 예쁘게 정리</p>
        <p className="text-sm text-gray-500">
          레시피·재료·단위 라벨에 색상을 입혀 한눈에 구분할 수 있습니다.
        </p>
      </Card>

      <ul className="space-y-3">
        {ENTRIES.map((entry) => (
          <li key={entry.href}>
            <Link href={entry.href} className="block">
              <Card
                accent={entry.accent}
                filled
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${PILL_BG[entry.accent]} ${TONE_TEXT[entry.accent]}`}
                  >
                    LABEL
                  </span>
                  <p className={`text-lg font-bold ${TONE_TEXT[entry.accent]}`}>{entry.title}</p>
                  <p className="text-sm text-gray-500">{entry.subtitle}</p>
                </div>
                <span aria-hidden="true" className={`text-lg ${TONE_TEXT[entry.accent]}`}>
                  ›
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
