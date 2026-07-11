"use client";

import { use } from "react";
import SupplierEditor from "../SupplierEditor";
import type { SupplierId } from "@/lib/domain/ids";

interface EditSupplierPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSupplierPage({ params }: EditSupplierPageProps) {
  const { id } = use(params);
  return <SupplierEditor key={id} supplierId={id as SupplierId} />;
}
