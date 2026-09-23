"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { fieldClass } from "@/components/ui/field-row";
import { accountErrorMessage } from "@/features/accounts/account-error";
import { useSetAccountPassword } from "@/features/accounts/api";
import type { Account } from "@/types/domain";

const MIN_LENGTH = 8;

/**
 * Reseteo de la contraseña de otra cuenta. No pide la actual —quien resetea no la
 * conoce—, y la API revoca los tokens de esa cuenta, así que se avisa de que
 * tendrá que volver a entrar.
 */
export function PasswordModal({
  account,
  open,
  onOpenChange,
}: {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const setPasswordMut = useSetAccountPassword();

  const tooShort = password.length < MIN_LENGTH;

  const close = (next: boolean) => {
    if (!next) {
      setPassword("");
      setError(null);
      setDone(false);
    }
    onOpenChange(next);
  };

  const submit = () => {
    setError(null);

    setPasswordMut.mutate(
      { id: account.id, newPassword: password },
      {
        onSuccess: () => setDone(true),
        onError: (cause) => setError(accountErrorMessage(cause)),
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={`Cambiar la contraseña de ${account.name}`}
      className="md:min-w-120"
    >
      <div className="p-6 sm:p-8">
        {done ? (
          <p>
            Contraseña actualizada. {account.name} tendrá que iniciar sesión de
            nuevo con la nueva contraseña.
          </p>
        ) : (
          <>
            <label className="mb-1 block font-medium text-secondary" htmlFor="new-password">
              Nueva contraseña
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
            <p className="mt-2 text-sm text-secondary">
              Mínimo {MIN_LENGTH} caracteres. Al guardarla se cerrarán las sesiones
              abiertas de esta cuenta.
            </p>

            {error && (
              <p role="alert" className="mt-3 font-medium text-warn-600">
                {error}
              </p>
            )}
          </>
        )}

        <ModalFooter>
          {done ? (
            <Button onClick={() => close(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => close(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submit}
                disabled={tooShort || setPasswordMut.isPending}
              >
                Guardar
              </Button>
            </>
          )}
        </ModalFooter>
      </div>
    </Modal>
  );
}
