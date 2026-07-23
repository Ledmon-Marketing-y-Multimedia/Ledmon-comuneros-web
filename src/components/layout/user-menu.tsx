"use client";

import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useCurrentUser } from "@/lib/auth/use-current-user";

/** Menú de usuario del header (equivalente a layout/common/user). */
export function UserMenu() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
        aria-label="Menú de usuario"
      >
        <UserCircleIcon className="h-6 w-6" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-99 min-w-56 rounded-md border border-gray-200 bg-white py-2 shadow-lg"
        >
          <div className="flex flex-col px-4 py-2 leading-none">
            <span className="text-secondary">Sesión iniciada como:</span>
            <span className="mt-1.5 text-md font-medium">{user?.email}</span>
          </div>
          <DropdownMenu.Separator className="my-2 h-px bg-gray-100" />
          <DropdownMenu.Item
            onSelect={() => router.push("/sign-out")}
            className="flex cursor-pointer items-center gap-3 px-4 py-2 outline-none hover:bg-gray-100"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-500" />
            <span>Cerrar sesión</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
