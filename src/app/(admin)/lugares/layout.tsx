import { LugaresList } from "@/features/lugares/lugares-list";

export default function LugaresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-auto">
      <LugaresList />
      {children}
    </div>
  );
}
