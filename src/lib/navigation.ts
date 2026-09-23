import type { ComponentType, SVGProps } from "react";
import {
  HomeIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  PresentationChartLineIcon,
  PrinterIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export interface NavItem {
  id: string;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  link: string;
  exactMatch?: boolean;
  /** Solo se muestra a las cuentas administradoras (gestión de usuarios). */
  adminOnly?: boolean;
}

/** Menú lateral portado 1:1 de core/navigation/navigation.ts (adminNavigation). */
export const adminNavigation: NavItem[] = [
  {
    id: "dashboard.main",
    title: "Inicio",
    icon: HomeIcon,
    link: "/home",
    exactMatch: true,
  },
  {
    id: "dashboard.lugares",
    title: "Direcciones",
    icon: BuildingStorefrontIcon,
    link: "/lugares",
    exactMatch: true,
  },
  {
    id: "dashboard.comuneros",
    title: "Comuneros",
    icon: UsersIcon,
    link: "/comuneros",
    exactMatch: true,
  },
  {
    id: "dashboard.reuniones",
    title: "Reuniones",
    icon: PresentationChartLineIcon,
    link: "/reuniones",
    exactMatch: true,
  },
  {
    id: "dashboard.comunicaciones",
    title: "Comunicaciones",
    icon: PrinterIcon,
    link: "/announcements",
    exactMatch: true,
  },
  {
    id: "dashboard.usuarios",
    title: "Usuarios",
    icon: ShieldCheckIcon,
    link: "/usuarios",
    exactMatch: true,
    adminOnly: true,
  },
];
