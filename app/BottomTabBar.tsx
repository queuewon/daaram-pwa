"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isTabActive } from "@/lib/domain/navigation";

interface TabDefinition {
  label: string;
  href: string;
}

const TABS: readonly TabDefinition[] = [
  { label: "홈", href: "/" },
  { label: "레시피", href: "/recipes" },
  { label: "재료", href: "/ingredients" },
  { label: "오늘생산", href: "/checklist" },
  { label: "설정", href: "/settings" },
];

const HIDDEN_PATHS: readonly string[] = ["/gate"];

export function BottomTabBar() {
  const pathname = usePathname();
  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white"
    >
      <div className="mx-auto flex h-[var(--tab-bar-height)] max-w-2xl">
        {TABS.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 items-center justify-center text-sm ${
                active ? "font-semibold text-brand" : "text-gray-500"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
