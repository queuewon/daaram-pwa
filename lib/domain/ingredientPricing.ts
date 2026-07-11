import { parseNonNegativeNumber } from "./numbers";
import type { NonNegativeNumber, OutOfRangeError, PositiveNumber } from "./numbers";
import type { Result } from "./result";

export function computePricePerGram(
  packagePrice: NonNegativeNumber,
  packageAmount: PositiveNumber,
): Result<NonNegativeNumber, OutOfRangeError> {
  return parseNonNegativeNumber(packagePrice / packageAmount);
}

export interface PackagePricePoint {
  packagePrice: number;
  packageAmount: number;
}

export function hasPackagePriceChanged(
  previous: PackagePricePoint,
  next: PackagePricePoint,
): boolean {
  return (
    previous.packagePrice !== next.packagePrice || previous.packageAmount !== next.packageAmount
  );
}

export type PriceDeltaDirection = "up" | "down" | "flat" | "first";

export interface PriceHistoryDelta {
  direction: PriceDeltaDirection;
  amountKrw: number;
}

export interface PriceHistoryPoint {
  packagePrice: number;
}

export function computePriceDeltas(
  historyDescending: readonly PriceHistoryPoint[],
): readonly PriceHistoryDelta[] {
  return historyDescending.map((entry, index) => {
    const older = historyDescending[index + 1];
    if (!older) return { direction: "first", amountKrw: 0 };

    const amountKrw = Math.abs(entry.packagePrice - older.packagePrice);
    if (entry.packagePrice > older.packagePrice) return { direction: "up", amountKrw };
    if (entry.packagePrice < older.packagePrice) return { direction: "down", amountKrw };
    return { direction: "flat", amountKrw: 0 };
  });
}
