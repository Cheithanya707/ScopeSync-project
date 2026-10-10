import { redirect } from "next/navigation";

type RouteProps = { params: Promise<{ projectId: string }> };

export default async function LegacyMarketplaceWorkspacePage({ params }: RouteProps) {
  const { projectId } = await params;
  redirect(`/projects/${encodeURIComponent(projectId)}`);
}
