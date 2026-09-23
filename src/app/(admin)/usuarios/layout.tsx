import { AccountsList } from "@/features/accounts/accounts-list";
import { AdminOnly } from "@/components/auth/admin-only";

export default function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminOnly>
      <div className="relative flex flex-auto">
        <AccountsList />
        {children}
      </div>
    </AdminOnly>
  );
}
