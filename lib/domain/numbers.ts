import { z } from "zod";
import { err, ok, type Result } from "./result";
import type { Branded } from "./ids";

export type NonNegativeNumber = Branded<number, "NonNegativeNumber">;
export type PositiveNumber = Branded<number, "PositiveNumber">;

export interface OutOfRangeError {
  type: "OutOfRange";
  value: number;
}

const nonNegativeSchema = z.number().min(0);
const positiveSchema = z.number().gt(0);

export function parseNonNegativeNumber(n: number): Result<NonNegativeNumber, OutOfRangeError> {
  const parsed = nonNegativeSchema.safeParse(n);
  return parsed.success
    ? ok(parsed.data as NonNegativeNumber)
    : err({ type: "OutOfRange", value: n });
}

export function parsePositiveNumber(n: number): Result<PositiveNumber, OutOfRangeError> {
  const parsed = positiveSchema.safeParse(n);
  return parsed.success ? ok(parsed.data as PositiveNumber) : err({ type: "OutOfRange", value: n });
}
