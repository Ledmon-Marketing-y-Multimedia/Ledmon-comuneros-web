"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import {
  UserCircleIcon,
  AtSymbolIcon,
  CreditCardIcon,
  HomeIcon,
  InformationCircleIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import {
  XMarkIcon as XSolid,
  QrCodeIcon,
  PencilSquareIcon,
  UserCircleIcon as UserSolid,
  CreditCardIcon as CreditSolid,
  AtSymbolIcon as AtSolid,
  MapPinIcon,
  HomeIcon as HomeSolid,
  TagIcon,
  TrashIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/solid";
import {
  useComunero,
  useCreateComunero,
  useUpdateComunero,
  useUpdateComuneroStatus,
  useDeleteComunero,
} from "@/features/comuneros/api";
import { useLugares } from "@/features/lugares/api";
import { StatusModal } from "@/features/comuneros/status-modal";
import { useConfirmation } from "@/components/ui/confirmation";
import { Button } from "@/components/ui/button";
import {
  DetailAvatar,
  DetailCover,
  FormActions,
  InfoRow,
} from "@/components/ui/detail-panel";
import { DetailPlaceholder } from "@/components/ui/empty-state";
import { FieldRow, fieldClass } from "@/components/ui/field-row";
import { pdfService } from "@/lib/pdf/pdf-service";
import {
  ComuneroStatus,
  statusLabel,
  attendanceLabel,
  type Comunero,
  type NewComunero,
} from "@/types/domain";

interface FormValues {
  id: string;
  name: string;
  phones: { phoneNumber: string; label: string }[];
  lugarId: string;
  email: string;
  username: string;
  emailCommunication: boolean;
  code: string;
  dni: string;
}

const EMPTY_COMUNERO: Comunero = {
  background: "",
  user: { name: "", id: "", username: "", phones: [], email: "" },
  id: "",
};

export function ComuneroDetails({
  comuneroId,
  isNew,
}: {
  comuneroId?: string;
  isNew?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirmation();

  const { comunero: found, isLoading } = useComunero(comuneroId ?? "");
  const { data: lugares = [] } = useLugares();

  // Las direcciones a medio crear (sin `address`) no son elegibles.
  const direcciones = lugares.filter((lugar) => lugar.address);

  const comunero: Comunero = isNew ? EMPTY_COMUNERO : (found ?? EMPTY_COMUNERO);

  const [editMode, setEditMode] = useState<boolean>(!!isNew);
  const [statusOpen, setStatusOpen] = useState(false);

  const createMut = useCreateComunero();
  const updateMut = useUpdateComunero();
  const statusMut = useUpdateComuneroStatus();
  const deleteMut = useDeleteComunero();

  const { register, control, handleSubmit, reset, formState } =
    useForm<FormValues>({
      defaultValues: {
        id: "",
        name: "",
        phones: [],
        lugarId: "",
        email: "",
        username: "",
        emailCommunication: false,
        code: "",
        dni: "",
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "phones" });

  // Reset del formulario cuando cambia el comunero (equivalente al subscribe de comunero$).
  useEffect(() => {
    const phones =
      comunero.user?.phones && comunero.user.phones.length > 0
        ? comunero.user.phones.map((p) => ({
            phoneNumber: p.phoneNumber,
            label: p.label,
          }))
        : [{ phoneNumber: "", label: "" }];

    reset({
      id: comunero.id ?? "",
      name: comunero.user?.name ?? "",
      phones,
      lugarId: comunero.lugar?.id ?? "",
      email: comunero.user?.email ?? "",
      username: comunero.user?.username ?? "",
      emailCommunication: comunero.emailCommunication ?? false,
      code: comunero.code ?? "",
      dni: comunero.user?.dni ?? "",
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditMode(comunero.user?.name === "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comunero.id, found]);

  const attendanceCount =
    comunero.attendances?.filter((x) => x.status === "PRESENT").length ?? 0;

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      phones: values.phones.filter((p) => p.phoneNumber),
    };

    if (payload.id === "") {
      const newComunero = { ...payload, role: "HOLDER" } as unknown as NewComunero;
      createMut.mutate(newComunero, {
        onSuccess: (created) => {
          router.push(`/comuneros/${created.id}`);
        },
      });
    } else {
      updateMut.mutate(
        { id: payload.id, comunero: payload as unknown as Comunero },
        {
          onSuccess: () => setEditMode(false),
        },
      );
    }
  };

  const changeStatus = (result: { comments: string }) => {
    if (!comunero.id) return;
    statusMut.mutate({
      id: comunero.id,
      comunero: {
        comments: result.comments,
        status: ComuneroStatus.UNSUBSCRIBED,
      },
    });
  };

  const deleteComunero = async () => {
    const ok = await confirm({
      title: "Borrar comunero",
      message:
        "¿Estás seguro de que quieres borrar este comunero? Esta acción no se puede deshacer.",
      actions: {
        confirm: { label: "Borrar" },
        cancel: { label: "Cancelar" },
      },
    });
    if (ok && comunero.id) {
      deleteMut.mutate(comunero.id, {
        onSuccess: () => {
          router.push("/comuneros");
          setEditMode(false);
        },
      });
    }
  };

  if (!isNew && isLoading && !found) {
    return <DetailPlaceholder title="Cargando…" />;
  }

  // Sin comunero no se cae al formulario vacío de alta: eso hacía parecer que el
  // guardado no había funcionado (y un segundo envío creaba otro comunero).
  if (!isNew && !found) {
    return (
      <DetailPlaceholder
        title="No se encuentra el comunero"
        description="Puede que se haya borrado desde otra sesión."
        backHref="/comuneros"
      />
    );
  }

  const initial = comunero.user?.name?.charAt(0) ?? "";

  return (
    <div className="flex w-full flex-col">
      {!editMode ? (
        <>
          {/* Header vista */}
          <DetailCover closeHref="/comuneros" />

          <div className="relative flex flex-auto flex-col items-center p-6 pt-0 sm:p-12 sm:pt-0">
            <div className="w-full max-w-3xl">
              <DetailAvatar
                initial={initial}
                actions={
                  <>
                    {comunero.status === "ACTIVE" && (
                      <Button
                        variant="secondary"
                        onClick={() => setStatusOpen(true)}
                      >
                        <XSolid className="h-5 w-5" />
                        <span>Dar de baja</span>
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => pdfService.comuneroCard(comunero)}
                    >
                      <QrCodeIcon className="h-5 w-5" />
                      <span>Tarjeta</span>
                    </Button>
                    <Button variant="secondary" onClick={() => setEditMode(true)}>
                      <PencilSquareIcon className="h-5 w-5" />
                      <span>Editar</span>
                    </Button>
                  </>
                }
              />

              <div className="mt-3 truncate text-4xl font-bold">
                {comunero.user?.name}
              </div>

              <div className="mt-4 flex flex-col space-y-8 border-t pt-6">
                {comunero.user?.username && (
                  <InfoRow icon={<UserCircleIcon className="h-6 w-6" />}>
                    {comunero.user.username}
                  </InfoRow>
                )}
                {comunero.user?.email && (
                  <InfoRow icon={<AtSymbolIcon className="h-6 w-6" />}>
                    {comunero.user.email}
                  </InfoRow>
                )}
                {comunero.user?.dni && (
                  <InfoRow icon={<CreditCardIcon className="h-6 w-6" />}>
                    {comunero.user.dni}
                  </InfoRow>
                )}
                {comunero.lugar?.address && (
                  <InfoRow
                    icon={<HomeIcon className="h-6 w-6" />}
                    href={`/lugares/${comunero.lugar.id}`}
                  >
                    {comunero.lugar.address}
                  </InfoRow>
                )}
                {comunero.status && (
                  <InfoRow icon={<InformationCircleIcon className="h-6 w-6" />}>
                    {statusLabel(comunero.status)}
                  </InfoRow>
                )}
                {!!comunero.user?.phones?.length && (
                  <InfoRow
                    icon={<PhoneIcon className="h-6 w-6" />}
                    align="top"
                    bodyClassName="min-w-0 space-y-1"
                  >
                    {comunero.user.phones.map((phone, i) => (
                      <div key={i} className="flex items-center leading-6">
                        <div className="ml-2.5 font-mono">
                          {phone.phoneNumber}
                        </div>
                        {phone.label && (
                          <div className="text-md truncate text-secondary">
                            <span className="mx-2">&bull;</span>
                            <span className="font-medium">{phone.label}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </InfoRow>
                )}
              </div>

              {comunero.attendances && (
                <div className="mt-8">
                  <h3 className="font-medium text-gray-900">
                    Registro de asistencia {attendanceCount} /{" "}
                    {comunero.attendances.length}
                  </h3>
                  <dl className="mt-2 divide-y divide-gray-200 border-b border-t border-gray-200">
                    {comunero.attendances.map(
                      (attendance, i) =>
                        attendance.meeting && (
                          <div
                            key={i}
                            className="flex justify-between py-3 text-sm font-medium"
                          >
                            <dt className="text-gray-500">
                              {attendance.meeting.name}
                            </dt>
                            <dd className="text-gray-900">
                              {attendanceLabel(attendance.status)}
                            </dd>
                          </div>
                        ),
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Header edición */}
          <DetailCover closeHref="/comuneros" />

          <div className="relative flex flex-auto flex-col items-center px-6 sm:px-12">
            <div className="w-full max-w-3xl">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DetailAvatar initial={initial} />

                {/* Nombre */}
                <FieldRow
                  icon={<UserSolid className="h-5 w-5" />}
                  label="Nombre y apellidos"
                  error={formState.errors.name?.message}
                >
                  <input
                    {...register("name", {
                      required: "El nombre es obligatorio.",
                    })}
                    placeholder="Nombre y apellidos"
                    spellCheck={false}
                    className={fieldClass}
                  />
                </FieldRow>

                {/* DNI */}
                <FieldRow icon={<CreditSolid className="h-5 w-5" />} label="DNI">
                  <input {...register("dni")} placeholder="DNI" className={fieldClass} />
                </FieldRow>

                {/* Email */}
                <FieldRow icon={<AtSolid className="h-5 w-5" />} label="Email">
                  <input {...register("email")} placeholder="Email" className={fieldClass} />
                </FieldRow>

                {/* Username */}
                <FieldRow icon={<UserSolid className="h-5 w-5" />} label="Nombre de usuario">
                  <input
                    {...register("username")}
                    placeholder="Nombre de usuario"
                    className={fieldClass}
                  />
                </FieldRow>

                {/* Código */}
                <FieldRow icon={<MapPinIcon className="h-5 w-5" />} label="Nº de comunero">
                  <input {...register("code")} placeholder="Nº comunero" className={fieldClass} />
                </FieldRow>

                {/* Lugar. Obligatorio: el comunero pertenece a la comunidad
                    *a través* de su dirección (así lo consulta el backend), y un
                    comunero sin ella no aparece en ningún listado. */}
                <FieldRow
                  icon={<HomeSolid className="h-5 w-5" />}
                  label="Lugar"
                  error={formState.errors.lugarId?.message}
                >
                  {direcciones.length > 0 ? (
                    <select
                      {...register("lugarId", {
                        required: "Elige la dirección del comunero.",
                      })}
                      className={fieldClass}
                    >
                      <option value="">Elige una dirección…</option>
                      {direcciones.map((lugar) => (
                        <option key={lugar.id} value={lugar.id}>
                          {lugar.address}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="py-2 text-secondary">
                      No hay direcciones dadas de alta.{" "}
                      <Link href="/lugares" className="text-primary underline">
                        Crea una dirección
                      </Link>{" "}
                      antes de añadir comuneros.
                    </p>
                  )}
                </FieldRow>

                {/* Email communication */}
                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register("emailCommunication")} />
                    <span>Recibir comunicaciones por email</span>
                  </label>
                </div>

                {/* Teléfonos */}
                <div className="mt-8">
                  <div className="space-y-4">
                    {fields.map((field, i) => {
                      const first = i === 0;
                      const last = i === fields.length - 1;
                      return (
                        <div key={field.id} className="relative flex">
                          <div className="flex-auto">
                            {first && (
                              <label className="mb-1 block text-secondary">
                                Nº de teléfono
                              </label>
                            )}
                            <input
                              {...register(`phones.${i}.phoneNumber` as const)}
                              placeholder="Phone"
                              className={fieldClass}
                            />
                          </div>
                          <div className="ml-2 w-full max-w-24 flex-auto sm:ml-4 sm:max-w-40">
                            {first && (
                              <label className="mb-1 block text-secondary">
                                Etiqueta
                              </label>
                            )}
                            <div className="flex items-center">
                              <TagIcon className="mr-2 hidden h-5 w-5 sm:block" />
                              <input
                                {...register(`phones.${i}.label` as const)}
                                placeholder="Label"
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
                    onClick={() => append({ phoneNumber: "", label: "" })}
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    <span className="ml-2 font-medium text-secondary group-hover:underline">
                      Añadir otro teléfono
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <FormActions
                  onCancel={() => setEditMode(false)}
                  saveDisabled={!formState.isValid && formState.isSubmitted}
                >
                  {comunero.id && (
                    <Button
                      variant="danger"
                      onClick={deleteComunero}
                      className="px-0"
                    >
                      Borrar comunero
                    </Button>
                  )}
                </FormActions>
              </form>
            </div>
          </div>
        </>
      )}

      <StatusModal
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onConfirm={changeStatus}
      />
    </div>
  );
}

