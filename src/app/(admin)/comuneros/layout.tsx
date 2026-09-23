import { ComunerosList } from "@/features/comuneros/comuneros-list";

/** Master-detail: la lista permanece montada y el detalle entra como drawer. */
export default function ComunerosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-auto">
      <ComunerosList />
      {children}
    </div>
  );
}
