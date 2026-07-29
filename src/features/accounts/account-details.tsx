"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import {
  AtSymbolIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  KeyIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import {
  useAccount,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
  type AccountChanges,
} from "@/features/accounts/api";
import { accountErrorMessage } from "@/features/accounts/account-error";
import { PasswordModal } from "@/features/accounts/password-modal";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/components/ui/confirmation";
import {
  DetailAvatar,
  DetailCover,
  FormActions,
  InfoRow,
} from "@/components/ui/detail-panel";
import { DetailPlaceholder } from "@/components/ui/empty-state";
import { FieldRow, fieldClass } from "@/components/ui/field-row";
import { badgeClass } from "@/components/ui/status-badge";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Account } from "@/types/domain";

const MIN_PASSWORD = 8;

interface FormValues {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  active: boolean;
}

function formatDate(value?: string): string {
  if (!value) return "Nunca";

  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AccountDetails({
  accountId,
  isNew,
}: {
  accountId?: string;
  isNew?: boolean;
}) {
  const router = useRouter();
  const { account: found, isLoading } = useAccount(isNew ? "" : (accountId ?? ""));
  const { data: currentAccount } = useCurrentUser();

  const createMut = useCreateAccount();
  const updateMut = useUpdateAccount();
  const deleteMut = useDeleteAccount();
  const confirm = useConfirmation();

  const [editMode, setEditMode] = useState(!!isNew);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const account: Account | null = isNew
    ? ({ id: "", name: "", isAdmin: false, active: true } as Account)
    : found;

  /**
   * La cuenta con la que estás dentro. El backend rechaza (409) que te degrades,
   * te desactives o te borres; aquí esos controles se desactivan directamente,
   * que es más claro que dejar pulsar y explicar el error después.
   */
  const isSelf = !isNew && account !== null && account.id === currentAccount?.id;

  const { register, handleSubmit, reset, control, formState } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      isAdmin: false,
      active: true,
    },
  });

  // `useWatch` en vez de `watch()`: el compilador de React no puede memoizar la
  // función que devuelve `watch` y avisa de UI obsoleta (regla
  // react-hooks/incompatible-library).
  const password = useWatch({ control, name: "password" }) ?? "";

  useEffect(() => {
    if (!account) return;

    reset({
      name: account.name ?? "",
      email: account.email ?? "",
      password: "",
      isAdmin: account.isAdmin ?? false,
      active: account.active ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id, found]);

  const onSubmit = (values: FormValues) => {
    setFormError(null);

    if (isNew) {
      createMut.mutate(
        {
          name: values.name,
          email: values.email,
          password: values.password,
          isAdmin: values.isAdmin,
          active: values.active,
        },
        {
          onSuccess: (created) => router.replace(`/usuarios/${created.id}`),
          onError: (cause) => setFormError(accountErrorMessage(cause)),
        },
      );

      return;
    }

    if (!account) return;

    // PATCH: solo lo que cambia. Los interruptores propios no se envían nunca
    // (están desactivados y la API los rechazaría con 409).
    const changes: AccountChanges = {};
    if (values.name !== account.name) changes.name = values.name;
    if (values.email !== (account.email ?? "")) changes.email = values.email;
    if (!isSelf && values.isAdmin !== account.isAdmin) changes.isAdmin = values.isAdmin;
    if (!isSelf && values.active !== account.active) changes.active = values.active;

    if (Object.keys(changes).length === 0) {
      setEditMode(false);

      return;
    }

    updateMut.mutate(
      { id: account.id, changes },
      {
        onSuccess: () => setEditMode(false),
        onError: (cause) => setFormError(accountErrorMessage(cause)),
      },
    );
  };

  const onDelete = async () => {
    if (!account) return;

    const confirmed = await confirm({
      title: "Eliminar usuario",
      message: `¿Seguro que quieres eliminar la cuenta de ${account.name}? Perderá el acceso inmediatamente.`,
      actions: { confirm: { label: "Eliminar" } },
    });

    if (!confirmed) return;

    setFormError(null);
    deleteMut.mutate(account.id, {
      onSuccess: () => router.push("/usuarios"),
      onError: (cause) => setFormError(accountErrorMessage(cause)),
    });
  };

  if (!isNew && isLoading && !account) {
    return <DetailPlaceholder title="Cargando…" />;
  }

  if (!account) {
    return (
      <DetailPlaceholder
        title="No se encuentra el usuario"
        description="Puede que se haya eliminado o que ya no esté en el listado."
        backHref="/usuarios"
      />
    );
  }

  return (
    <div className="flex w-full flex-col">
      <DetailCover closeHref="/usuarios" />

      {!editMode ? (
        <div className="relative flex flex-auto flex-col items-center p-6 pt-0 sm:p-12 sm:pt-0">
          <div className="w-full max-w-3xl">
            <DetailAvatar
              initial={account.name.charAt(0)}
              actions={
                <>
                  <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
                    <KeyIcon className="h-5 w-5" />
                    <span>Contraseña</span>
                  </Button>
                  <Button variant="secondary" onClick={() => setEditMode(true)}>
                    <PencilSquareIcon className="h-5 w-5" />
                    <span>Editar usuario</span>
                  </Button>
                </>
              }
            />

            <div className="mt-3 truncate text-4xl font-bold">{account.name}</div>

            <div className="mt-4 flex flex-col space-y-8 border-t pt-6">
              {account.email && (
                <InfoRow icon={<AtSymbolIcon className="h-6 w-6" />}>
                  {account.email}
                </InfoRow>
              )}

              <InfoRow icon={<ShieldCheckIcon className="h-6 w-6" />}>
                {account.isAdmin ? (
                  <span className="flex items-center gap-2">
                    <span className={badgeClass("positive")}>Admin</span>
                    <span className="text-secondary">
                      Puede gestionar usuarios
                    </span>
                  </span>
                ) : (
                  "Usuario normal (no gestiona usuarios)"
                )}
              </InfoRow>

              <InfoRow icon={<CheckCircleIcon className="h-6 w-6" />}>
                {!account.active
                  ? "Cuenta desactivada: no puede iniciar sesión"
                  : account.hasPassword === false
                    ? "Sin contraseña: no puede iniciar sesión hasta que se le asigne una"
                    : "Cuenta activa"}
              </InfoRow>

              <InfoRow icon={<ClockIcon className="h-6 w-6" />}>
                Último acceso: {formatDate(account.lastLogin)}
              </InfoRow>
            </div>

            {formError && (
              <p role="alert" className="mt-6 font-medium text-warn-600">
                {formError}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex flex-auto flex-col items-center px-6 sm:px-12">
          <div className="w-full max-w-3xl">
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldRow
                icon={<UserIcon className="h-5 w-5" />}
                label="Nombre"
                error={formState.errors.name?.message}
              >
                <input
                  {...register("name", { required: "El nombre es obligatorio." })}
                  // FieldRow pinta la etiqueta suelta (sin htmlFor, porque no
                  // controla el id del campo): el aria-label da el nombre
                  // accesible que necesitan lectores de pantalla y tests.
                  aria-label="Nombre"
                  placeholder="Nombre y apellidos"
                  className={fieldClass}
                />
              </FieldRow>

              <FieldRow
                icon={<AtSymbolIcon className="h-5 w-5" />}
                label="Email"
                error={formState.errors.email?.message}
              >
                <input
                  {...register("email", {
                    required: "El email es obligatorio.",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email no válido.",
                    },
                  })}
                  type="email"
                  aria-label="Email"
                  autoComplete="off"
                  placeholder="nombre@dominio.com"
                  className={fieldClass}
                />
              </FieldRow>

              {/* La contraseña solo se pide en el alta: una cuenta sin ella no
                  podría entrar. Para cambiarla después está el botón Contraseña. */}
              {isNew && (
                <FieldRow
                  icon={<KeyIcon className="h-5 w-5" />}
                  label="Contraseña"
                  error={formState.errors.password?.message}
                >
                  <input
                    {...register("password", {
                      required: "La contraseña es obligatoria.",
                      minLength: {
                        value: MIN_PASSWORD,
                        message: `Mínimo ${MIN_PASSWORD} caracteres.`,
                      },
                    })}
                    type="password"
                    aria-label="Contraseña"
                    autoComplete="new-password"
                    className={fieldClass}
                  />
                </FieldRow>
              )}

              <div className="mt-8 space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...register("isAdmin")}
                    disabled={isSelf}
                    className="h-4 w-4"
                  />
                  <span>
                    Administrador
                    <span className="ml-2 text-secondary">
                      (puede crear y editar usuarios)
                    </span>
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...register("active")}
                    disabled={isSelf}
                    className="h-4 w-4"
                  />
                  <span>
                    Activo
                    <span className="ml-2 text-secondary">
                      (si se desactiva, se cierran sus sesiones)
                    </span>
                  </span>
                </label>

                {isSelf && (
                  <p className="text-secondary">
                    Estás editando tu propia cuenta: no puedes quitarte el permiso
                    de administrador ni desactivarte. Que lo haga otro
                    administrador.
                  </p>
                )}
              </div>

              {formError && (
                <p role="alert" className="mt-6 font-medium text-warn-600">
                  {formError}
                </p>
              )}

              <FormActions
                onCancel={() => {
                  setFormError(null);
                  if (isNew) {
                    router.push("/usuarios");
                  } else {
                    reset();
                    setEditMode(false);
                  }
                }}
                saveDisabled={
                  createMut.isPending ||
                  updateMut.isPending ||
                  (isNew && password.length < MIN_PASSWORD)
                }
              >
                {!isNew && !isSelf && (
                  <Button variant="danger" onClick={onDelete}>
                    <TrashIcon className="h-5 w-5" />
                    <span>Eliminar</span>
                  </Button>
                )}
              </FormActions>
            </form>
          </div>
        </div>
      )}

      {!isNew && (
        <PasswordModal
          account={account}
          open={passwordOpen}
          onOpenChange={setPasswordOpen}
        />
      )}
    </div>
  );
}
