"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <main>
      <PageHeader title="설정" />

      <Link href="/settings/categories">
        <Card accent="neutral" className="space-y-1">
          <p className="font-bold">카테고리 관리</p>
          <p className="text-sm text-gray-500">레시피 카테고리 · 재료 카테고리 · 포장 단위</p>
        </Card>
      </Link>
    </main>
  );
}
