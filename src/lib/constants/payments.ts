import type { PaymentMethod, PaymentStatus, PaymentType, Project } from "@/types";

export const PAYMENT_STATUSES: { value: Exclude<PaymentStatus, "overdue">; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: "advance", label: "Advance" },
  { value: "milestone", label: "Milestone" },
  { value: "final", label: "Final Payment" },
  { value: "additional_work", label: "Additional Work" },
  { value: "refund", label: "Refund" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online Payment" },
  { value: "other", label: "Other" },
];

export const PAYMENT_CURRENCIES: { value: Project["currency"]; label: string }[] = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — Pound Sterling" },
];

export const PAYMENT_SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount_high", label: "Amount High to Low" },
  { value: "amount_low", label: "Amount Low to High" },
  { value: "due_date", label: "Due Date" },
  { value: "name", label: "Payment Name" },
] as const;

export type PaymentSort = (typeof PAYMENT_SORTS)[number]["value"];
