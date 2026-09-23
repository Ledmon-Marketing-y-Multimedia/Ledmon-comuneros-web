"use client";

import { useRouter } from "next/navigation";
import { DetailDrawer } from "@/components/layout/detail-drawer";
import { AccountDetails } from "@/features/accounts/account-details";

/** Alta de usuario: la cuenta no existe en la API hasta que se guarda. */
export default function NewAccountPage() {
  const router = useRouter();

  return (
    <DetailDrawer onClose={() => router.push("/usuarios")}>
      <AccountDetails isNew />
    </DetailDrawer>
  );
}
