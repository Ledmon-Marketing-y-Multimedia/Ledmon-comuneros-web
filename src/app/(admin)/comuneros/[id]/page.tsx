"use client";

import { useParams, useRouter } from "next/navigation";
import { DetailDrawer } from "@/components/layout/detail-drawer";
import { ComuneroDetails } from "@/features/comuneros/comunero-details";

export default function ComuneroDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  return (
    <DetailDrawer onClose={() => router.push("/comuneros")}>
      <ComuneroDetails comuneroId={String(params.id)} />
    </DetailDrawer>
  );
}
