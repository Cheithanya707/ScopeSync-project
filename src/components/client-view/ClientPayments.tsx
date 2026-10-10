import { ReceiptText } from "lucide-react";
import type { ClientShareSnapshot } from "@/services/client-view/clientShareData";
import { ClientCard, ClientEmpty, clientDateLabel, clientHumanize } from "@/components/client-view/ClientViewPrimitives";

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function ClientPayments({ payments }: { payments: ClientShareSnapshot["payments"] }) {
  return <ClientCard title="Project payments" icon={ReceiptText}>{payments.length === 0 ? <ClientEmpty>No payment records are available to share.</ClientEmpty> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-3 pr-4 font-medium">Payment</th><th className="py-3 pr-4 font-medium">Type</th><th className="py-3 pr-4 font-medium">Amount</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-4 font-medium">Due date</th><th className="py-3 font-medium">Paid date</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-b border-border last:border-0"><th scope="row" className="py-3 pr-4 font-medium text-slate-900">{payment.title}</th><td className="py-3 pr-4 capitalize text-slate-700">{clientHumanize(payment.type)}</td><td className="py-3 pr-4 text-slate-700">{money(payment.amount, payment.currency)}</td><td className="py-3 pr-4 capitalize text-slate-700">{clientHumanize(payment.status)}</td><td className="py-3 pr-4 text-slate-700">{clientDateLabel(payment.dueDate)}</td><td className="py-3 text-slate-700">{clientDateLabel(payment.paidDate)}</td></tr>)}</tbody></table></div>}</ClientCard>;
}
