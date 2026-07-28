"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import {
  XMarkIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  PencilSquareIcon,
  BriefcaseIcon as BriefcaseSolid,
  BuildingOffice2Icon as BuildingSolid,
  CheckCircleIcon as CheckSolid,
  MapPinIcon as MapPinSolid,
  TagIcon,
  TrashIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/solid";
import { useLugar, useUpdateLugar } from "@/features/lugares/api";
import {
  ComuneroRole,
  LugarStatus,
  statusLabel,
  type Comunero,
  type Lugar,
} from "@/types/domain";

const STATUSES = Object.values(LugarStatus);

interface FormValues {
  id: string;
  address: string;
  poblacion: string;
  zona: string;
  cp: string;
  status: string;
  autorizados: { id?: string; name: string; dni: string }[];
}

const inputCls =
  "w-full border-b border-gray-300 bg-transparent py-2 focus:border-primary focus:outline-none";

export function LugarDetails({ lugarId }: { lugarId: string }) {
  const { lugar: found, isLoading, data: lugares = [] } = useLugar(lugarId);
  const updateMut = useUpdateLugar();

  const lugar: Lugar | null = found;
  const [editMode, setEditMode] = useState(false);

  const zonas = useMemo(
    () => Array.from(new Set(lugares.map((l) => l.zona).filter(Boolean))),
    [lugares],
  );

  const holder: Comunero | undefined = lugar?.comuneros?.find(
    (x) => x.role === ComuneroRole.HOLDER,
  );
  const autorizados: Comunero[] =
    lugar?.comuneros?.filter((x) => x.role === ComuneroRole.AUTHORIZED) ?? [];

  const { register, control, handleSubmit, reset, formState } =
    useForm<FormValues>({
      defaultValues: {
        id: "",
        address: "",
        poblacion: "",
        zona: "",
        cp: "",
        status: "",
        autorizados: [],
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "autorizados",
  });

  useEffect(() => {
    if (!lugar) return;
    const autorizadosForm =
      autorizados.length > 0
        ? autorizados.map((a) => ({
            id: a.id,
            name: a.user?.name ?? "",
            dni: a.user?.dni ?? "",
          }))
        : [{ name: "", dni: "" }];

    reset({
      id: lugar.id ?? "",
      address: lugar.address ?? "",
      poblacion: lugar.poblacion ?? "",
      zona: lugar.zona ?? "",
      cp: lugar.cp ?? "",
      status: (lugar.status as string) ?? "",
      autorizados: autorizadosForm,
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditMode(lugar.address == null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugar?.id, found]);

  const onSubmit = (values: FormValues) => {
    const autorizadosFiltered = values.autorizados.filter(
      (x) => x.name !== "" && x.dni !== "",
    );
    const comuneros = autorizadosFiltered.map((a) => ({
      user: { name: a.name, dni: a.dni },
      id: a.id,
      role: ComuneroRole.AUTHORIZED,
    }));

    const payload = {
      ...values,
      comuneros,
      autorizados: undefined,
    } as unknown as Lugar;

    updateMut.mutate(
      { id: values.id, lugar: payload },
      { onSuccess: () => setEditMode(false) },
    );
  };

  if (isLoading && !lugar) {
    return (
      <div className="flex h-full items-center justify-center p-16 text-secondary">
        Cargando…
      </div>
    );
  }

  // Sin lugar no se deja el panel en blanco: se dice qué ha pasado y se ofrece
  // la salida (antes esto devolvía null y el drawer aparecía vacío).
  if (!lugar) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-16 text-center">
        <p className="text-xl font-semibold">No se encuentra la dirección</p>
        <p className="text-secondary">
          Puede que se haya eliminado o que ya no esté en el listado.
        </p>
        <Link
          href="/lugares"
          className="rounded border px-4 py-2 font-medium hover:bg-gray-100"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  const initial = lugar.address?.charAt(0) ?? "";

  return (
    <div className="flex w-full flex-col">
      {!editMode ? (
        <>
          <div className="relative h-40 w-full bg-gray-200 px-8 sm:h-48 sm:px-12">
            <img
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              src="/assets/images/marcon_desde_salgueiral.jpg"
              alt=""
            />
            <div className="mx-auto flex w-full max-w-3xl items-center justify-end pt-6">
              <Link
                href="/lugares"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>

          <div className="relative flex flex-auto flex-col items-center p-6 pt-0 sm:p-12 sm:pt-0">
            <div className="w-full max-w-3xl">
              <div className="-mt-16 flex flex-auto items-end">
                <div className="ring-bg-card flex h-32 w-32 items-center justify-center overflow-hidden rounded-full ring-4">
                  <div className="flex h-full w-full items-center justify-center rounded bg-gray-200 text-8xl font-bold uppercase leading-none text-gray-600">
                    {initial}
                  </div>
                </div>
                <div className="mb-1 ml-auto flex items-center">
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center gap-2 rounded border px-4 py-2 font-medium hover:bg-gray-100"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                    <span>Editar lugar</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 truncate text-4xl font-bold">
                {lugar.address}
              </div>

              <div className="mt-4 flex flex-col space-y-8 border-t pt-6">
                {lugar.status && (
                  <div className="flex sm:items-center">
                    <CheckCircleIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">
                      {statusLabel(lugar.status)}
                    </div>
                  </div>
                )}
                {lugar.zona && (
                  <div className="flex sm:items-center">
                    <BriefcaseIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">{lugar.zona}</div>
                  </div>
                )}
                {lugar.poblacion && (
                  <div className="flex sm:items-center">
                    <BuildingOffice2Icon className="h-6 w-6" />
                    <div className="ml-6 leading-6">{lugar.poblacion}</div>
                  </div>
                )}
                {lugar.cp && (
                  <div className="flex sm:items-center">
                    <MapPinIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">{lugar.cp}</div>
                  </div>
                )}
                {holder && (
                  <Link
                    href={`/comuneros/${holder.id}`}
                    className="flex sm:items-center"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">
                      {holder.user?.name} (Comunero)
                    </div>
                  </Link>
                )}
                {autorizados.map((autorizado) => (
                  <div key={autorizado.id} className="flex sm:items-center">
                    <UserCircleIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">
                      {autorizado.user?.name} (Autorizado)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="relative h-40 w-full bg-gray-200 px-8 sm:h-48 sm:px-12">
            <img
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              src="/assets/images/marcon_desde_salgueiral.jpg"
              alt=""
            />
            <div className="mx-auto flex w-full max-w-3xl items-center justify-end pt-6">
              <Link
                href="/lugares"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>

          <div className="relative flex flex-auto flex-col items-center px-6 sm:px-12">
            <div className="w-full max-w-3xl">
              <form onSubmit={handleSubmit(onSubmit)}>
                <FieldRow icon={<BriefcaseSolid className="h-5 w-5" />} label="Dirección">
                  <input
                    {...register("address", { required: true })}
                    placeholder="Dirección"
                    className={inputCls}
                  />
                </FieldRow>

                {zonas.length > 0 && (
                  <FieldRow icon={<BuildingSolid className="h-5 w-5" />} label="Lugar">
                    <select {...register("zona")} className={inputCls}>
                      <option value="" />
                      {zonas.map((z) => (
                        <option key={String(z)} value={String(z)}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                )}

                <FieldRow icon={<CheckSolid className="h-5 w-5" />} label="Estado">
                  <select {...register("status")} className={inputCls}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow icon={<MapPinSolid className="h-5 w-5" />} label="Población">
                  <input
                    {...register("poblacion")}
                    placeholder="Población"
                    className={inputCls}
                  />
                </FieldRow>

                <FieldRow icon={<MapPinSolid className="h-5 w-5" />} label="Código postal">
                  <input
                    {...register("cp")}
                    placeholder="Código postal"
                    className={inputCls}
                  />
                </FieldRow>

                {/* Autorizados */}
                <div className="mt-8">
                  <label className="mb-4 block font-medium text-secondary">
                    Autorizados
                  </label>
                  <div className="space-y-4">
                    {fields.map((field, i) => {
                      const first = i === 0;
                      const last = i === fields.length - 1;
                      return (
                        <div key={field.id} className="relative flex">
                          <div className="flex-auto">
                            {first && (
                              <label className="mb-1 block text-secondary">
                                Nombre y apellidos
                              </label>
                            )}
                            <input
                              {...register(`autorizados.${i}.name` as const)}
                              placeholder="Nombre"
                              className={inputCls}
                            />
                          </div>
                          <div className="ml-2 w-full max-w-24 flex-auto sm:ml-4 sm:max-w-40">
                            {first && (
                              <label className="mb-1 block text-secondary">
                                DNI
                              </label>
                            )}
                            <div className="flex items-center">
                              <TagIcon className="mr-2 hidden h-5 w-5 sm:block" />
                              <input
                                {...register(`autorizados.${i}.dni` as const)}
                                placeholder="DNI"
                                className={inputCls}
                              />
                            </div>
                          </div>
                          {!(first && last) && (
                            <div
                              className={
                                "flex w-10 items-center pl-2 " +
                                (first ? "mt-6" : "")
                              }
                            >
                              <button
                                type="button"
                                onClick={() => remove(i)}
                                title="Remove"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className="group -ml-4 mt-2 inline-flex cursor-pointer items-center rounded px-4 py-2"
                    onClick={() => append({ name: "", dni: "" })}
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    <span className="ml-2 font-medium text-secondary group-hover:underline">
                      Añade un autorizado
                    </span>
                  </div>
                </div>

                <div className="-mx-6 mt-10 flex items-center border-t bg-gray-50 py-4 pl-1 pr-4 sm:-mx-12 sm:pl-7 sm:pr-12">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="ml-auto rounded px-4 py-2 font-medium hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!formState.isValid && formState.isSubmitted}
                    className="ml-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <label className="mb-1 block font-medium text-secondary">{label}</label>
      <div className="flex items-center gap-2">
        <span className="hidden text-gray-500 sm:block">{icon}</span>
        {children}
      </div>
    </div>
  );
}
