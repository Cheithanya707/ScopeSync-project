"use client";

import { useParams } from "next/navigation";
import { PaymentEditor } from "@/components/payments/PaymentEditor";

export default function EditProjectPaymentPage() {
  const { projectId, paymentId } = useParams<{ projectId: string; paymentId: string }>();
  return <PaymentEditor projectId={projectId} paymentId={paymentId} />;
}
