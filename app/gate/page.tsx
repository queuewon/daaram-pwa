"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function GatePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasError(false);

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
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <label htmlFor="gate-password">비밀번호</label>
        <input
          id="gate-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit">입장</button>
      </form>
      {hasError && <p>비밀번호가 올바르지 않습니다.</p>}
    </main>
  );
}
