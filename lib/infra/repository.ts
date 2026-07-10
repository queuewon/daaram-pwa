import type { IndexableType } from "dexie";
import type { z } from "zod";
import { err, ok, type Result } from "../domain/result";

export interface RepositoryReadError {
  type: "CorruptedRecord";
  id: string;
  issues: z.core.$ZodIssue[];
}

export interface RepositoryNotFoundError {
  type: "NotFound";
  id: string;
}

export interface RepositoryListResult<T> {
  items: T[];
  skippedCount: number;
}

export interface Repository<T extends { id: TId }, TId extends IndexableType> {
  create(entity: T): Promise<void>;
  get(id: TId): Promise<Result<T | null, RepositoryReadError>>;
  list(): Promise<Result<RepositoryListResult<T>, never>>;
  update(entity: T): Promise<Result<void, RepositoryNotFoundError>>;
  remove(id: TId): Promise<void>;
}

// Dexie의 Table<T,TId> 전체 인터페이스(where/modify 등, EntityTable의 InsertType
// 공변성 때문에 구체 도메인 타입과 구조적으로 안 맞는 메서드 포함)를 요구하는 대신,
// 실제로 쓰는 5개 메서드만 요구하는 최소 인터페이스로 좁혀서 타입 불일치를 피한다.
export interface RepositoryTable<T, TId extends IndexableType> {
  get(id: TId): Promise<T | undefined>;
  toArray(): Promise<T[]>;
  add(item: T): Promise<TId>;
  put(item: T): Promise<TId>;
  delete(id: TId): Promise<void>;
}

export function createRepository<T extends { id: TId }, TId extends IndexableType>(
  table: RepositoryTable<T, TId>,
  schema: z.ZodType<T>,
): Repository<T, TId> {
  return {
    async create(entity) {
      await table.add(entity);
    },

    async get(id) {
      const row = await table.get(id);
      if (row === undefined) return ok(null);

      const parsed = schema.safeParse(row);
      if (!parsed.success) {
        return err({ type: "CorruptedRecord", id: String(id), issues: parsed.error.issues });
      }
      return ok(parsed.data);
    },

    async list() {
      const rows = await table.toArray();
      const items: T[] = [];
      let skippedCount = 0;

      for (const row of rows) {
        const parsed = schema.safeParse(row);
        if (parsed.success) {
          items.push(parsed.data);
        } else {
          skippedCount += 1;
        }
      }

      return ok({ items, skippedCount });
    },

    async update(entity) {
      const existing = await table.get(entity.id);
      if (existing === undefined) {
        return err({ type: "NotFound", id: String(entity.id) });
      }
      await table.put(entity);
      return ok(undefined);
    },

    async remove(id) {
      await table.delete(id);
    },
  };
}
