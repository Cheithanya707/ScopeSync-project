import { PAYMENT_METHODS, PAYMENT_TYPES } from "@/lib/constants/payments";
import type { Payment } from "@/types";

export { formatPaymentNumber } from "@/lib/utils/paymentUtils";

export function paymentTypeLabel(value: Payment["type"]): string {
  return PAYMENT_TYPES.find((option) => option.value === value)?.label ?? "Other";
}

export function paymentMethodLabel(value?: Payment["method"]): string {
  return value ? PAYMENT_METHODS.find((option) => option.value === value)?.label ?? "Other" : "—";
}

export function formatPaymentDate(value?: string): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date)
    : "Invalid date";
}
