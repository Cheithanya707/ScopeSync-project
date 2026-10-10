"use client";

import { PaymentManager } from "@/components/payments/PaymentManager";
import { useAuth } from "@/context/AuthContext";

export default function WorkspacePaymentsPage() {
  const { user } = useAuth();
  return <PaymentManager ownerId={user?.uid ?? "local-preview-user"} />;
}
