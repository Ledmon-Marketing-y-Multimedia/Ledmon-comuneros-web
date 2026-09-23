"use client";

import { useParams, useRouter } from "next/navigation";
import { DetailDrawer } from "@/components/layout/detail-drawer";
import { LugarDetails } from "@/features/lugares/lugar-details";

export default function LugarDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  return (
    <DetailDrawer onClose={() => router.push("/lugares")}>
      <LugarDetails lugarId={String(params.id)} />
    </DetailDrawer>
  );
}
