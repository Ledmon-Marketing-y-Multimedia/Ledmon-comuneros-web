"use client";

import { useParams } from "next/navigation";
import { AnnouncementDetails } from "@/features/announcements/announcement-details";

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  return <AnnouncementDetails announcementId={String(params.id)} />;
}
