"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { TONE_TEXT, type Tone } from "./theme";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  tone?: Tone;
  /** Show a "← 뒤로가기" nav row above the title. */
  back?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
  /** Title alignment when `back` is set. Top-level headers are always left-aligned. */
  align?: "left" | "center";
}

export function PageHeader({
  title,
  subtitle,
  tone = "brand",
  back = false,
  onBack,
  actions,
  align = "center",
}: PageHeaderProps) {
  const router = useRouter();
  const titleColor = tone === "neutral" ? "text-gray-900" : TONE_TEXT[tone];

  if (back) {
    return (
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={onBack ?? (() => router.back())}
            className="shrink-0 border-none px-1 py-1 text-sm text-gray-600 hover:bg-transparent hover:text-gray-900"
          >
            ← 뒤로가기
          </button>
          {actions && <div className="flex shrink-0 justify-end gap-2">{actions}</div>}
        </div>
        <div className={align === "center" ? "text-center" : ""}>
          <h1 className={`text-lg font-bold ${titleColor}`}>{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className={`text-2xl font-bold ${titleColor}`}>{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
