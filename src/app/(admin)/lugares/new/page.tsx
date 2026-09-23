"use client";

import { useRouter } from "next/navigation";
import { DetailDrawer } from "@/components/layout/detail-drawer";
import { LugarDetails } from "@/features/lugares/lugar-details";

/**
 * Alta de dirección. El lugar no existe en la API hasta que se guarda: antes
 * "Nueva dirección" hacía el POST al pulsarla y dejaba una fila vacía si nadie
 * completaba el formulario.
 */
export default function NewLugarPage() {
  const router = useRouter();
  return (
    <DetailDrawer onClose={() => router.push("/lugares")}>
      <LugarDetails isNew />
    </DetailDrawer>
  );
}
