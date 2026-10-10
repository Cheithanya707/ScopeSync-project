"use client";

import { useParams } from "next/navigation";
import { PaymentEditor } from "@/components/payments/PaymentEditor";

export default function NewProjectPaymentPage() {
  const { projectId } = useParams<{ projectId: string }>();
  return <PaymentEditor projectId={projectId} />;
}
