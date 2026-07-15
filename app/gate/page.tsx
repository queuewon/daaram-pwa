"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function GatePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasError(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        setHasError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-brand-soft px-6">
      <div className="w-full max-w-sm rounded-3xl border border-pink-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/indigo-gelato-heart.jpg"
            alt=""
            className="h-16 w-16 rounded-2xl object-cover"
          />
          <h1 className="mt-4 text-xl font-bold text-gray-900">다아람</h1>
          <p className="mt-1 text-sm text-gray-500">비밀번호를 입력해 주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-3">
          <div>
            <label htmlFor="gate-password" className="sr-only">
              비밀번호
            </label>
            <input
              id="gate-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              placeholder="비밀번호"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (hasError) setHasError(false);
              }}
              className="w-full text-center"
              aria-invalid={hasError}
            />
            {hasError && (
              <p role="alert" className="mt-2 text-center text-sm text-danger">
                비밀번호가 올바르지 않습니다.
              </p>
            )}
          </div>

          <Button
            type="submit"
            tone="brand"
            fullWidth
            disabled={isSubmitting || password.length === 0}
          >
            {isSubmitting ? "확인 중…" : "입장"}
          </Button>
        </form>
      </div>
    </main>
  );
}
