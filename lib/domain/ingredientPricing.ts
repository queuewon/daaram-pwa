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
