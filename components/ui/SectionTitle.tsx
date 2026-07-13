import type { ReactNode } from "react";
import { TONE_DOT, type Tone } from "./theme";

export interface SectionTitleProps {
  tone?: Tone;
  children: ReactNode;
  /** Optional right-aligned slot (e.g. a "전체 보기" link or "+ 등록" button). */
  action?: ReactNode;
}

export function SectionTitle({ tone = "brand", children, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[tone]}`}
        />
        <span className="text-base font-bold text-gray-900">{children}</span>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
