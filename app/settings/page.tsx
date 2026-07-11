"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { exportBackup, triggerBackupDownload, wipeAllData } from "@/lib/infra/backup";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const APP_VERSION = "1.0.0";

interface PendingWipeConfirm {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export default function SettingsPage() {
  const [pendingWipeConfirm, setPendingWipeConfirm] = useState<PendingWipeConfirm | null>(null);
  const [wipeMessage, setWipeMessage] = useState<string | null>(null);

  async function handleBackupNow() {
    const backup = await exportBackup();
    triggerBackupDownload(backup);
  }

  function handleRequestWipe() {
    setWipeMessage(null);
    setPendingWipeConfirm({
      title: "모든 데이터 삭제",
      description:
        "레시피, 재료, 공급업체, 오늘생산 기록 등 모든 데이터가 영구적으로 삭제됩니다. 삭제 전에 백업하기를 먼저 하세요. 계속하시겠습니까?",
      confirmLabel: "계속",
      onConfirm: () => {
        setPendingWipeConfirm({
          title: "정말 삭제할까요?",
          description: "이 작업은 되돌릴 수 없습니다. 정말로 모든 데이터를 삭제하시겠습니까?",
          confirmLabel: "모든 데이터 삭제",
          onConfirm: handleWipeConfirmed,
        });
      },
    });
  }

  async function handleWipeConfirmed() {
    setPendingWipeConfirm(null);
    const result = await wipeAllData();
    setWipeMessage(result.ok ? "모든 데이터를 삭제했습니다." : "삭제 중 오류가 발생했습니다.");
  }

  return (
    <main>
      <PageHeader title="설정" />

      <Link href="/settings/categories">
        <Card accent="neutral" className="space-y-1">
          <p className="font-bold">카테고리 관리</p>
          <p className="text-sm text-gray-500">레시피 카테고리 · 재료 카테고리 · 포장 단위</p>
        </Card>
      </Link>

      <section>
        <h2>데이터 관리</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleBackupNow}
            className="border-data bg-data text-white hover:bg-data"
          >
            백업하기
          </button>
          <Link
            href="/backup"
            className="inline-block rounded border border-data px-3 py-1 text-data hover:bg-data-soft"
          >
            백업에서 복원
          </Link>
        </div>
      </section>

      <section>
        <h2>단위 설정</h2>
        <p className="text-sm text-gray-500">기본 단위: g — 현재는 그램만 지원</p>
      </section>

      <section>
        <h2>데이터 초기화</h2>
        <button type="button" onClick={handleRequestWipe} className="text-danger">
          모든 데이터 삭제
        </button>
        {wipeMessage && <p className="text-sm text-gray-500">{wipeMessage}</p>}
      </section>

      <footer className="flex flex-col items-center gap-2 pt-6 text-center">
        <Image
          src="/brand/indigo-gelato-mascot.jpg"
          alt="Indigo Gelato"
          width={64}
          height={64}
          className="rounded-full object-cover"
        />
        <p className="text-sm text-gray-500">앱 버전 {APP_VERSION}</p>
      </footer>

      <ConfirmDialog
        open={pendingWipeConfirm !== null}
        title={pendingWipeConfirm?.title ?? ""}
        description={pendingWipeConfirm?.description ?? ""}
        confirmLabel={pendingWipeConfirm?.confirmLabel}
        destructive
        onConfirm={() => pendingWipeConfirm?.onConfirm()}
        onCancel={() => setPendingWipeConfirm(null)}
      />
    </main>
  );
}
