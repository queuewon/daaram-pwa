import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>다아람</h1>
      <nav className="flex gap-3">
        <Link href="/checklist" className="underline">
          오늘 생산
        </Link>
        <Link href="/recipes" className="underline">
          레시피
        </Link>
        <Link href="/ingredients" className="underline">
          재료
        </Link>
        <Link href="/suppliers" className="underline">
          공급업체
        </Link>
        <Link href="/settings" className="underline">
          설정
        </Link>
      </nav>
    </main>
  );
}
