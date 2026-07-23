"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export interface ConfirmationConfig {
  title?: string;
  message?: string;
  icon?: { show?: boolean; color?: "warn" | "primary" };
  actions?: {
    confirm?: { show?: boolean; label?: string; color?: "warn" | "primary" };
    cancel?: { show?: boolean; label?: string };
  };
  dismissible?: boolean;
}

/** Config por defecto (portada de FuseConfirmationService). */
const defaultConfig: Required<
  Omit<ConfirmationConfig, "icon" | "actions">
> & {
  icon: NonNullable<ConfirmationConfig["icon"]>;
  actions: {
    confirm: { show: boolean; label: string; color: "warn" | "primary" };
    cancel: { show: boolean; label: string };
  };
} = {
  title: "Confirmar acción",
  message: "¿Seguro que quieres confirmar esta acción?",
  icon: { show: true, color: "warn" },
  actions: {
    confirm: { show: true, label: "Confirmar", color: "warn" },
    cancel: { show: true, label: "Cancelar" },
  },
  dismissible: false,
};

type ConfirmFn = (config?: ConfirmationConfig) => Promise<boolean>;

const ConfirmationContext = createContext<ConfirmFn | null>(null);

export function useConfirmation(): ConfirmFn {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) {
    throw new Error("useConfirmation debe usarse dentro de ConfirmationProvider");
  }
  return ctx;
}

export function ConfirmationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(defaultConfig);
  const resolver = useRef<(v: boolean) => void>(null);

  const confirm = useCallback<ConfirmFn>((userConfig) => {
    setConfig({
      ...defaultConfig,
      ...userConfig,
      icon: { ...defaultConfig.icon, ...userConfig?.icon },
      actions: {
        confirm: {
          ...defaultConfig.actions.confirm,
          ...userConfig?.actions?.confirm,
        },
        cancel: {
          ...defaultConfig.actions.cancel,
          ...userConfig?.actions?.cancel,
        },
      },
    });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    setOpen(false);
    resolver.current?.(result);
    resolver.current = null;
  };

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      <RadixDialog.Root
        open={open}
        onOpenChange={(o) => {
          if (!o) close(false);
        }}
      >
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-99 bg-black/40" />
          <RadixDialog.Content
            onEscapeKeyDown={(e) => {
              if (!config.dismissible) e.preventDefault();
            }}
            onInteractOutside={(e) => {
              if (!config.dismissible) e.preventDefault();
            }}
            className="fixed left-1/2 top-1/2 z-99 w-full max-w-100 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-card shadow-xl focus:outline-none"
          >
            <div className="flex flex-col items-center p-8 pb-6 sm:flex-row sm:items-start sm:pb-8">
              {config.icon.show && (
                <div
                  className={
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:mr-4 " +
                    (config.icon.color === "warn"
                      ? "bg-red-100 text-red-600"
                      : "bg-primary-100 text-primary-600")
                  }
                >
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </div>
              )}
              <div className="mt-4 text-center sm:mt-0 sm:text-left">
                <RadixDialog.Title className="text-xl font-medium leading-6">
                  {config.title}
                </RadixDialog.Title>
                <RadixDialog.Description className="mt-2 text-secondary">
                  {config.message}
                </RadixDialog.Description>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 bg-gray-50 px-6 py-4 sm:justify-end">
              {config.actions.cancel.show && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-md px-4 py-2 font-medium hover:bg-gray-200"
                >
                  {config.actions.cancel.label}
                </button>
              )}
              {config.actions.confirm.show && (
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={
                    "rounded-md px-4 py-2 font-medium text-white " +
                    (config.actions.confirm.color === "warn"
                      ? "bg-warn-600 hover:bg-warn-500"
                      : "bg-primary hover:bg-primary-600")
                  }
                >
                  {config.actions.confirm.label}
                </button>
              )}
            </div>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </ConfirmationContext.Provider>
  );
}
