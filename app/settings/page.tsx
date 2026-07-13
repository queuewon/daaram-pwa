"use client";

import { useState } from "react";
import Link from "next/link";
import { exportBackup, triggerBackupDownload, wipeAllData } from "@/lib/infra/backup";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
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
      <PageHeader title="설정" tone="brand" />

      <div className="space-y-3">
        <SectionTitle tone="brand">카테고리 관리</SectionTitle>
        <Link href="/settings/categories" className="block">
          <Card accent="brand" className="flex items-center justify-between gap-3">
            <span className="font-semibold text-gray-900">카테고리 관리</span>
            <span aria-hidden="true" className="text-lg text-brand">
              ›
            </span>
          </Card>
        </Link>
      </div>

      <div className="space-y-3">
        <SectionTitle tone="data">데이터 관리</SectionTitle>
        <Button type="button" tone="data" variant="solid" fullWidth onClick={handleBackupNow}>
          백업하기
        </Button>
        <Link
          href="/backup"
          className="flex w-full items-center justify-center rounded-full border border-data bg-white px-4 py-2 text-sm font-semibold text-data hover:bg-data-soft"
        >
          백업에서 복원
        </Link>
      </div>

      <div className="space-y-3">
        <SectionTitle tone="ingredient">단위 설정</SectionTitle>
        <Card accent="ingredient" className="space-y-1">
          <p className="font-bold text-gray-900">기본 단위: g</p>
          <p className="text-sm text-gray-500">현재는 그램(g)만 지원해요. 추후 확장 예정.</p>
        </Card>
      </div>

      <div className="space-y-3">
        <SectionTitle tone="danger">데이터 초기화</SectionTitle>
        <Button type="button" tone="danger" variant="soft" fullWidth onClick={handleRequestWipe}>
          모든 데이터 삭제
        </Button>
        {wipeMessage && <p className="text-sm text-gray-500">{wipeMessage}</p>}
      </div>

      <footer className="flex flex-col items-center gap-2 pt-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/indigo-gelato-mascot.jpg"
          alt="Indigo Gelato"
          width={64}
          height={64}
          className="h-16 w-16 rounded-full object-cover"
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
