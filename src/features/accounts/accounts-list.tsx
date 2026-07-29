"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useAccounts } from "@/features/accounts/api";
import { ButtonLink } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { ListTable } from "@/components/ui/list-table";
import { SearchInput } from "@/components/ui/search-input";
import { badgeClass } from "@/components/ui/status-badge";
import { usePagination } from "@/lib/use-pagination";
import type { Account } from "@/types/domain";

const GRID_COLS =
  "grid-cols-[200px_auto] md:grid-cols-[220px_1fr_120px_120px] lg:grid-cols-[260px_1fr_140px_160px]";

/** Filtros del desplegable. La lista es corta: se filtra en cliente. */
const FILTERS = {
  all: () => true,
  admin: (account: Account) => account.isAdmin,
  inactive: (account: Account) => !account.active || account.hasPassword === false,
} as const;

type FilterKey = keyof typeof FILTERS;

/** Fecha del último acceso, o el hueco si esa cuenta nunca ha entrado. */
function lastLoginLabel(account: Account): string {
  if (!account.lastLogin) return "Nunca";

  return new Date(account.lastLogin).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AccountsList() {
  const pathname = usePathname();
  const selectedId = useMemo(() => {
    const match = pathname.match(/\/usuarios\/([^/]+)/);
    return match && match[1] !== "new" ? match[1] : null;
  }, [pathname]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data: accounts = [] } = useAccounts();

  // `GET /account` no acepta búsqueda (son un puñado de cuentas, no cientos como
  // los comuneros): se filtra aquí y así el buscador responde sin ir a la red.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return accounts.filter((account) => {
      if (!FILTERS[filter](account)) return false;
      if (term === "") return true;

      return (
        account.name.toLowerCase().includes(term) ||
        (account.email ?? "").toLowerCase().includes(term)
      );
    });
  }, [accounts, filter, search]);

  const count = accounts.length;
  const pagination = usePagination(filtered);

  return (
    <div className="flex min-w-0 flex-auto flex-col overflow-hidden bg-card sm:absolute sm:inset-0">
      <div className="relative flex flex-0 flex-col border-b px-6 py-8 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div>
          <div className="text-4xl font-extrabold leading-none tracking-tight">
            Usuarios
          </div>
          <div className="ml-0.5 font-medium text-secondary">
            {count > 0 && <span>{count} </span>}
            {count === 0 ? "Sin usuarios" : count === 1 ? "usuario" : "usuarios"}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-y-2 sm:mt-0 md:mt-4">
          <div className="flex-auto">
            <SearchInput
              value={search}
              onValueChange={(value) => {
                setSearch(value);
                pagination.reset();
              }}
              placeholder="Buscar usuarios"
              className="md:w-64"
            />
          </div>

          <FilterSelect
            value={filter}
            onValueChange={(value) => {
              setFilter(value as FilterKey);
              pagination.reset();
            }}
            className="md:ml-4 md:w-44"
          >
            <option value="all">Todos los usuarios</option>
            <option value="admin">Administradores</option>
            <option value="inactive">Sin acceso</option>
          </FilterSelect>

          <ButtonLink href="/usuarios/new" className="w-full md:ml-4 md:w-44">
            <PlusIcon className="h-5 w-5" />
            <span className="mr-1">Nuevo usuario</span>
          </ButtonLink>
        </div>
      </div>

      <ListTable
        columns={[
          { label: "Nombre" },
          { label: "Email", className: "hidden md:block" },
          { label: "Permisos", className: "hidden md:block" },
          { label: "Último acceso", className: "hidden md:block" },
        ]}
        gridCols={GRID_COLS}
        items={pagination.pageItems}
        rowHref={(account) => `/usuarios/${account.id}`}
        isSelected={(account) => selectedId === account.id}
        emptyMessage="No existen usuarios"
        pagination={pagination}
        renderRow={(account) => (
          <>
            <div className="truncate font-medium">{account.name}</div>
            <div className="hidden truncate text-secondary md:block">
              {account.email}
            </div>
            <div className="hidden truncate md:block">
              {account.isAdmin && (
                <span className={badgeClass("positive")}>Admin</span>
              )}
            </div>
            <div className="hidden items-center gap-2 truncate md:flex">
              {/* Una cuenta desactivada o sin contraseña no puede entrar: se dice
                  en la fila para no tener que abrir la ficha de una en una. */}
              {!account.active ? (
                <span className={badgeClass("negative")}>Desactivada</span>
              ) : account.hasPassword === false ? (
                <span className={badgeClass("negative")}>Sin clave</span>
              ) : (
                <span className="text-secondary">{lastLoginLabel(account)}</span>
              )}
            </div>
          </>
        )}
      />
    </div>
  );
}
