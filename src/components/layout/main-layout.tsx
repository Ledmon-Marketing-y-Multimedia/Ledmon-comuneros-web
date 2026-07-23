"use client";

import { useState } from "react";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

/**
 * Layout principal (equivalente al classic de Fuse): navegación lateral,
 * header con toggle + logo + menú de usuario, contenido y footer.
 */
export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex h-full min-h-full w-full">
      {/* Sidebar fijo (escritorio) */}
      <aside className="hidden w-64 shrink-0 md:block print:hidden">
        <SidebarNav />
      </aside>

      {/* Sidebar móvil (overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-90 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Wrapper */}
      <div className="flex min-w-0 flex-auto flex-col">
        {/* Header */}
        <header className="relative z-49 flex h-16 flex-0 items-center bg-card px-4 shadow md:px-6 print:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Abrir navegación"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex w-full items-center justify-center p-6">
            <Image
              src="/assets/images/logo.png"
              alt="Logo"
              width={288}
              height={78}
              className="w-72"
              priority
            />
          </div>

          <div className="ml-auto flex items-center gap-1 pl-2 sm:gap-2">
            <UserMenu />
          </div>
        </header>

        {/* Contenido */}
        <main className={cn("flex flex-auto flex-col")}>{children}</main>

        {/* Footer */}
        <footer className="relative z-49 flex h-14 flex-0 items-center justify-start border-t bg-card px-4 md:px-6 print:hidden">
          <span className="font-medium text-secondary">
            Comunidad de Montes de Marcón &copy; {currentYear}
          </span>
        </footer>
      </div>
    </div>
  );
}
