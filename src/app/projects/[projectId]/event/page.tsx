"use client";

import { useParams } from "next/navigation";
import { EventManagementPage } from "@/components/events/EventManagementPage";

export default function EventOverviewRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  return <EventManagementPage projectId={projectId} view="overview" />;
}
