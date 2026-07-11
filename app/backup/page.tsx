"use client";

import { useState, type ChangeEvent } from "react";
import {
  exportBackup,
  importBackup,
  readBackupFileAsJson,
  triggerBackupDownload,
} from "@/lib/infra/backup";
const TABLE_LABEL: Record<string, string> = {
  recipes: "레시피",
  recipe_versions: "레시피 수정이력",
  ingredients: "재료",
  ingredient_price_history: "재료 가격이력",
  suppliers: "공급업체",
  daily_checklist: "오늘 생산 체크리스트",
  recipe_categories: "레시피 카테고리",
  ingredient_categories: "재료 카테고리",
  package_units: "포장단위",
};

export default function BackupPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleExport() {
    setErrorMessage(null);
    const backup = await exportBackup();
    triggerBackupDownload(backup);
    setMessage("백업 파일을 내려받았습니다.");
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setMessage(null);
    setErrorMessage(null);
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const readResult = await readBackupFileAsJson(file);
    if (!readResult.ok) {
      setErrorMessage("JSON 파일이 손상되어 있습니다.");
      return;
    }

    const confirmed = window.confirm(
      "가져오기를 진행하면 현재 저장된 모든 데이터가 이 백업 파일 내용으로 완전히 대체됩니다. 계속하시겠습니까?",
    );
    if (!confirmed) return;

    await runImport(readResult.value);
  }

  async function runImport(raw: unknown, forceEmpty = false) {
    try {
      const result = await importBackup(raw, { forceEmpty });

      if (!result.ok) {
        if (result.error.type === "RequiresConfirmation") {
          const tableNames = result.error.emptiedTables
            .map((name) => TABLE_LABEL[name] ?? name)
            .join(", ");
          const confirmed = window.confirm(
            `백업 파일에 ${tableNames}가 0개입니다. 현재 데이터가 모두 삭제됩니다. 정말 진행하시겠습니까?`,
          );
          if (confirmed) await runImport(raw, true);
          return;
        }

        setErrorMessage(
          result.error.type === "UnsupportedVersion"
            ? `지원하지 않는 백업 버전입니다 (${result.error.found}).`
            : "백업 파일 구조가 올바르지 않습니다.",
        );
        return;
      }

      setMessage("가져오기가 완료됐습니다.");
    } catch {
      setErrorMessage("가져오는 중 오류가 발생해 되돌렸습니다. 기존 데이터는 그대로입니다.");
    }
  }

  return (
    <main>
      <h1>백업</h1>

      <section>
        <h2>내보내기</h2>
        <button type="button" onClick={handleExport}>
          백업 파일 내려받기
        </button>
      </section>

      <section>
        <h2>가져오기</h2>
        <input type="file" accept="application/json" onChange={handleFileChange} />
      </section>

      {message && <p>{message}</p>}
      {errorMessage && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {errorMessage}
        </p>
      )}
    </main>
  );
}
