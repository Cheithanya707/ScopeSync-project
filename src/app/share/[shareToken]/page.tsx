import { ClientProjectView } from "@/components/client-view/ClientProjectView";

export default async function SharedProjectPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  return <ClientProjectView key={shareToken} shareToken={shareToken} />;
}
