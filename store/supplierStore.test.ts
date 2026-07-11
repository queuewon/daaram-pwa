import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../lib/infra/db";
import { useSupplierStore } from "./supplierStore";
import type { SupplierId } from "../lib/domain/ids";

beforeEach(async () => {
  await db.open();
  useSupplierStore.setState({ suppliers: [] });
});

afterEach(async () => {
  await db.suppliers.clear();
});

function validForm(overrides: Partial<Record<string, unknown>> = {}) {
  return { name: "동네유업", contact: "010-1234-5678", memo: "", ...overrides };
}

describe("supplierStore.saveSupplier — 생성", () => {
  it("supplierId가 null이면 새 Supplier를 만든다", async () => {
    const result = await useSupplierStore.getState().saveSupplier({
      supplierId: null,
      form: validForm(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("동네유업");
    expect(useSupplierStore.getState().suppliers).toHaveLength(1);
  });

  it("잘못된 폼 입력이면 InvalidForm 오류를 반환하고 아무것도 저장하지 않는다", async () => {
    const result = await useSupplierStore.getState().saveSupplier({
      supplierId: null,
      form: validForm({ name: "" }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("InvalidForm");
    expect(useSupplierStore.getState().suppliers).toHaveLength(0);
  });
});

describe("supplierStore.saveSupplier — 수정", () => {
  it("기존 공급업체를 수정한다", async () => {
    const created = await useSupplierStore.getState().saveSupplier({
      supplierId: null,
      form: validForm(),
    });
    if (!created.ok) throw new Error("test setup");

    const updated = await useSupplierStore.getState().saveSupplier({
      supplierId: created.value.id,
      form: validForm({ contact: "010-9999-0000" }),
    });

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.contact).toBe("010-9999-0000");
    expect(useSupplierStore.getState().suppliers).toHaveLength(1);
  });

  it("존재하지 않는 supplierId로 수정하면 NotFound 오류를 반환한다", async () => {
    const result = await useSupplierStore.getState().saveSupplier({
      supplierId: "no-such-supplier" as SupplierId,
      form: validForm(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("NotFound");
  });
});

describe("supplierStore.removeSupplier", () => {
  it("공급업체를 목록에서 제거한다", async () => {
    const created = await useSupplierStore.getState().saveSupplier({
      supplierId: null,
      form: validForm(),
    });
    if (!created.ok) throw new Error("test setup");

    await useSupplierStore.getState().removeSupplier(created.value.id);

    expect(useSupplierStore.getState().suppliers).toHaveLength(0);
  });
});
