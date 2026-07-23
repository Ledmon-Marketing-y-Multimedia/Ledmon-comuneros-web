"use client";

import { useRouter } from "next/navigation";
import { DetailDrawer } from "@/components/layout/detail-drawer";
import { ComuneroDetails } from "@/features/comuneros/comunero-details";

export default function NewComuneroPage() {
  const router = useRouter();
  return (
    <DetailDrawer onClose={() => router.push("/comuneros")}>
      <ComuneroDetails isNew />
    </DetailDrawer>
  );
}
