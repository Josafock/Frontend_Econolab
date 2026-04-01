export type SortDirection = "asc" | "desc";

export function compareText(left: string, right: string) {
  return left.localeCompare(right, "es-MX", {
    sensitivity: "base",
    numeric: true,
  });
}

export function compareNumber(left: number, right: number) {
  return left - right;
}

export function compareDate(left?: string | null, right?: string | null) {
  const leftTime = left ? new Date(left).getTime() : 0;
  const rightTime = right ? new Date(right).getTime() : 0;
  return leftTime - rightTime;
}

export function applySortDirection(
  comparison: number,
  direction: SortDirection,
) {
  return direction === "asc" ? comparison : -comparison;
}
