"use client";

import { DocumentManager } from "@/components/documents/DocumentManager";
import { useAuth } from "@/context/AuthContext";

export default function WorkspaceDocumentsPage() {
  const { user } = useAuth();
  return <DocumentManager ownerId={user?.uid ?? "local-preview-user"} />;
}
