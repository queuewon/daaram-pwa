"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSupplierStore } from "@/store/supplierStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function SuppliersPage() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  return (
    <main>
      <PageHeader
        title="공급업체"
        subtitle="연락처·메모 관리"
        tone="ingredient"
        back
        actions={
          <Link
            href="/suppliers/new"
            className="inline-flex items-center rounded-full bg-ingredient-soft px-4 py-2 text-sm font-semibold text-ingredient hover:brightness-95"
          >
            + 새 공급업체
          </Link>
        }
      />

      {suppliers.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState title="공급업체가 없습니다" subtitle="+ 버튼으로 추가하세요" graphic />
        </div>
      ) : (
        <ul className="space-y-3">
          {suppliers.map((supplier) => (
            <li key={supplier.id}>
              <Link href={`/suppliers/${supplier.id}`} className="block">
                <Card accent="ingredient" className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">{supplier.name}</p>
                    {supplier.contact && (
                      <p className="mt-1 truncate text-sm text-gray-500">{supplier.contact}</p>
                    )}
                  </div>
                  <span aria-hidden="true" className="text-lg text-ingredient">
                    ›
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
