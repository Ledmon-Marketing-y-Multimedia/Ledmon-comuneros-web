"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { adminNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Navegación lateral (equivalente a fuse-vertical-navigation con adminNavigation). */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col bg-gray-900 text-gray-300">
      {/* Header con logo */}
      <div className="flex h-30 items-center justify-center p-6 pb-0">
        <Image
          src="/assets/images/logo_corto.png"
          alt="Logo"
          width={176}
          height={80}
          className="w-44 invert"
          priority
        />
      </div>

      {/* Items */}
      <ul className="mt-6 flex flex-col gap-1 px-3">
        {adminNavigation.map((item) => {
          const active = item.exactMatch
            ? pathname === item.link
            : pathname.startsWith(item.link);
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.link}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-2.5 text-base font-medium transition-colors",
                  active
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800/60 hover:text-white",
                )}
              >
                <Icon className="h-6 w-6 shrink-0" />
                <span>{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
