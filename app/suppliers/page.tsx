"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupplierStore } from "@/store/supplierStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Supplier } from "@/lib/domain/entities";

export default function SuppliersPage() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);
  const removeSupplier = useSupplierStore((s) => s.removeSupplier);

  const [pendingDelete, setPendingDelete] = useState<Supplier | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  return (
    <main>
      <PageHeader
        title="공급업체"
        actions={
          <Link
            href="/suppliers/new"
            className="inline-block rounded border border-gray-400 px-3 py-1 hover:bg-gray-100"
          >
            새 공급업체
          </Link>
        }
      />

      {suppliers.length === 0 ? (
        <EmptyState
          title="아직 등록된 공급업체가 없습니다"
          subtitle="새 공급업체를 추가해 보세요"
        />
      ) : (
        <ul className="space-y-3">
          {suppliers.map((supplier) => (
            <li key={supplier.id}>
              <Card accent="neutral" className="flex items-center justify-between gap-2">
                <Link href={`/suppliers/${supplier.id}`} className="underline">
                  {supplier.name}
                </Link>
                <span className="text-sm text-gray-500">{supplier.contact}</span>
                <button type="button" onClick={() => setPendingDelete(supplier)}>
                  삭제
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="공급업체 삭제"
        description={`"${pendingDelete?.name ?? ""}" 공급업체를 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (pendingDelete) removeSupplier(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
