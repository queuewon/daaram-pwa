"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSupplierStore } from "@/store/supplierStore";

export default function SuppliersPage() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);
  const removeSupplier = useSupplierStore((s) => s.removeSupplier);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  return (
    <main>
      <h1>공급업체</h1>
      <Link
        href="/suppliers/new"
        className="inline-block rounded border border-gray-400 px-3 py-1 hover:bg-gray-100"
      >
        새 공급업체
      </Link>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
        {suppliers.map((supplier) => (
          <li key={supplier.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <Link href={`/suppliers/${supplier.id}`} className="underline">
              {supplier.name}
            </Link>
            <span className="text-sm text-gray-500">{supplier.contact}</span>
            <button type="button" onClick={() => removeSupplier(supplier.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
