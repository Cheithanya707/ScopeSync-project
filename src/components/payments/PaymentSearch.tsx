import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PaymentSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="relative"><label htmlFor="payment-search" className="sr-only">Search payments</label><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="payment-search" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search number, title, description or reference" className="pl-9" /></div>;
}
