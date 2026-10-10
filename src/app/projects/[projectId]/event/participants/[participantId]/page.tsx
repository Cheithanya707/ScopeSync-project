"use client";

import { useParams } from "next/navigation";
import { EventManagementPage } from "@/components/events/EventManagementPage";

export default function ParticipantDetailsRoute() {
  const { projectId, participantId } = useParams<{ projectId: string; participantId: string }>();
  return <EventManagementPage projectId={projectId} participantId={participantId} view="participant-detail" />;
}
