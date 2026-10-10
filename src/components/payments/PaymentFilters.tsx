import { PAYMENT_METHODS, PAYMENT_SORTS, PAYMENT_STATUSES, PAYMENT_TYPES, type PaymentSort } from "@/lib/constants/payments";
import type { PaymentMethod, PaymentType, PaymentStatus } from "@/types";

const selectStyle = "h-11 w-full min-w-0 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function PaymentFilters({ status, type, method, sort, onStatus, onType, onMethod, onSort }: {
  status: PaymentStatus | "all";
  type: PaymentType | "all";
  method: PaymentMethod | "all";
  sort: PaymentSort;
  onStatus: (value: PaymentStatus | "all") => void;
  onType: (value: PaymentType | "all") => void;
  onMethod: (value: PaymentMethod | "all") => void;
  onSort: (value: PaymentSort) => void;
}) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <label className="sr-only" htmlFor="payment-status-filter">Filter by status</label><select className={selectStyle} id="payment-status-filter" value={status} onChange={(event) => onStatus(event.target.value as PaymentStatus | "all")}><option value="all">All statuses</option>{[...PAYMENT_STATUSES, { value: "overdue" as const, label: "Overdue" }].map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <label className="sr-only" htmlFor="payment-type-filter">Filter by payment type</label><select className={selectStyle} id="payment-type-filter" value={type} onChange={(event) => onType(event.target.value as PaymentType | "all")}><option value="all">All types</option>{PAYMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <label className="sr-only" htmlFor="payment-method-filter">Filter by method</label><select className={selectStyle} id="payment-method-filter" value={method} onChange={(event) => onMethod(event.target.value as PaymentMethod | "all")}><option value="all">All methods</option>{PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <label className="sr-only" htmlFor="payment-sort">Sort payments</label><select className={selectStyle} id="payment-sort" value={sort} onChange={(event) => onSort(event.target.value as PaymentSort)}>{PAYMENT_SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
  </div>;
}
