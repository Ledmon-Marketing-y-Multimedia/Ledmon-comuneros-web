"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
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
import { Button } from "@/components/ui/button";
import {
  DetailAvatar,
  DetailCover,
  FormActions,
  InfoRow,
} from "@/components/ui/detail-panel";
import { DetailPlaceholder } from "@/components/ui/empty-state";
import { FieldRow, fieldClass } from "@/components/ui/field-row";
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
    return <DetailPlaceholder title="Cargando…" />;
  }

  // Sin lugar no se deja el panel en blanco: se dice qué ha pasado y se ofrece
  // la salida (antes esto devolvía null y el drawer aparecía vacío).
  if (!lugar) {
    return (
      <DetailPlaceholder
        title="No se encuentra la dirección"
        description="Puede que se haya eliminado o que ya no esté en el listado."
        backHref="/lugares"
      />
    );
  }

  const initial = lugar.address?.charAt(0) ?? "";

  return (
    <div className="flex w-full flex-col">
      {!editMode ? (
        <>
          <DetailCover closeHref="/lugares" />

          <div className="relative flex flex-auto flex-col items-center p-6 pt-0 sm:p-12 sm:pt-0">
            <div className="w-full max-w-3xl">
              <DetailAvatar
                initial={initial}
                actions={
                  <Button variant="secondary" onClick={() => setEditMode(true)}>
                    <PencilSquareIcon className="h-5 w-5" />
                    <span>Editar lugar</span>
                  </Button>
                }
              />

              <div className="mt-3 truncate text-4xl font-bold">
                {lugar.address}
              </div>

              <div className="mt-4 flex flex-col space-y-8 border-t pt-6">
                {lugar.status && (
                  <InfoRow icon={<CheckCircleIcon className="h-6 w-6" />}>
                    {statusLabel(lugar.status)}
                  </InfoRow>
                )}
                {lugar.zona && (
                  <InfoRow icon={<BriefcaseIcon className="h-6 w-6" />}>
                    {lugar.zona}
                  </InfoRow>
                )}
                {lugar.poblacion && (
                  <InfoRow icon={<BuildingOffice2Icon className="h-6 w-6" />}>
                    {lugar.poblacion}
                  </InfoRow>
                )}
                {lugar.cp && (
                  <InfoRow icon={<MapPinIcon className="h-6 w-6" />}>
                    {lugar.cp}
                  </InfoRow>
                )}
                {holder && (
                  <InfoRow
                    icon={<UserCircleIcon className="h-6 w-6" />}
                    href={`/comuneros/${holder.id}`}
                  >
                    {holder.user?.name} (Comunero)
                  </InfoRow>
                )}
                {autorizados.map((autorizado) => (
                  <InfoRow
                    key={autorizado.id}
                    icon={<UserCircleIcon className="h-6 w-6" />}
                  >
                    {autorizado.user?.name} (Autorizado)
                  </InfoRow>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <DetailCover closeHref="/lugares" />

          <div className="relative flex flex-auto flex-col items-center px-6 sm:px-12">
            <div className="w-full max-w-3xl">
              <form onSubmit={handleSubmit(onSubmit)}>
                <FieldRow icon={<BriefcaseSolid className="h-5 w-5" />} label="Dirección">
                  <input
                    {...register("address", { required: true })}
                    placeholder="Dirección"
                    className={fieldClass}
                  />
                </FieldRow>

                {zonas.length > 0 && (
                  <FieldRow icon={<BuildingSolid className="h-5 w-5" />} label="Lugar">
                    <select {...register("zona")} className={fieldClass}>
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
                  <select {...register("status")} className={fieldClass}>
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
                    className={fieldClass}
                  />
                </FieldRow>

                <FieldRow icon={<MapPinSolid className="h-5 w-5" />} label="Código postal">
                  <input
                    {...register("cp")}
                    placeholder="Código postal"
                    className={fieldClass}
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
                              className={fieldClass}
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
                                className={fieldClass}
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

                <FormActions
                  onCancel={() => setEditMode(false)}
                  saveDisabled={!formState.isValid && formState.isSubmitted}
                />
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

