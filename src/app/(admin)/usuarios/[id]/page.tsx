"use client";

import { useParams, useRouter } from "next/navigation";
import { DetailDrawer } from "@/components/layout/detail-drawer";
import { AccountDetails } from "@/features/accounts/account-details";

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <DetailDrawer onClose={() => router.push("/usuarios")}>
      <AccountDetails accountId={String(params.id)} />
    </DetailDrawer>
  );
}
