"use client";

import { useParams } from "next/navigation";
import { MeetingDetails } from "@/features/meetings/meeting-details";

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  return <MeetingDetails meetingId={String(params.id)} />;
}
