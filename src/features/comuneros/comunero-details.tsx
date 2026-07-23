"use client";

/* eslint-disable @next/next/no-img-element */
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
  XMarkIcon,
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

const inputCls =
  "w-full border-b border-gray-300 bg-transparent py-2 focus:border-primary focus:outline-none";

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
    return (
      <div className="flex h-full items-center justify-center p-16 text-secondary">
        Cargando…
      </div>
    );
  }

  const initial = comunero.user?.name?.charAt(0) ?? "";

  return (
    <div className="flex w-full flex-col">
      {!editMode ? (
        <>
          {/* Header vista */}
          <div className="relative h-40 w-full bg-gray-200 px-8 sm:h-48 sm:px-12">
            <img
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              src="/assets/images/marcon_desde_salgueiral.jpg"
              alt=""
            />
            <div className="mx-auto flex w-full max-w-3xl items-center justify-end pt-6">
              <Link
                href="/comuneros"
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
                <div className="mb-1 ml-auto flex items-center gap-2">
                  {comunero.status === "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() => setStatusOpen(true)}
                      className="inline-flex items-center gap-2 rounded border px-4 py-2 font-medium hover:bg-gray-100"
                    >
                      <XSolid className="h-5 w-5" />
                      <span>Dar de baja</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => pdfService.comuneroCard(comunero)}
                    className="inline-flex items-center gap-2 rounded border px-4 py-2 font-medium hover:bg-gray-100"
                  >
                    <QrCodeIcon className="h-5 w-5" />
                    <span>Tarjeta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center gap-2 rounded border px-4 py-2 font-medium hover:bg-gray-100"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 truncate text-4xl font-bold">
                {comunero.user?.name}
              </div>

              <div className="mt-4 flex flex-col space-y-8 border-t pt-6">
                {comunero.user?.username && (
                  <div className="flex sm:items-center">
                    <UserCircleIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">
                      {comunero.user.username}
                    </div>
                  </div>
                )}
                {comunero.user?.email && (
                  <div className="flex sm:items-center">
                    <AtSymbolIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">{comunero.user.email}</div>
                  </div>
                )}
                {comunero.user?.dni && (
                  <div className="flex sm:items-center">
                    <CreditCardIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">{comunero.user.dni}</div>
                  </div>
                )}
                {comunero.lugar?.address && (
                  <Link
                    href={`/lugares/${comunero.lugar.id}`}
                    className="flex sm:items-center"
                  >
                    <HomeIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">
                      {comunero.lugar.address}
                    </div>
                  </Link>
                )}
                {comunero.status && (
                  <div className="flex sm:items-center">
                    <InformationCircleIcon className="h-6 w-6" />
                    <div className="ml-6 leading-6">
                      {statusLabel(comunero.status)}
                    </div>
                  </div>
                )}
                {!!comunero.user?.phones?.length && (
                  <div className="flex">
                    <PhoneIcon className="h-6 w-6" />
                    <div className="ml-6 min-w-0 space-y-1">
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
                    </div>
                  </div>
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
          <div className="relative h-40 w-full bg-gray-200 px-8 sm:h-48 sm:px-12">
            <img
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              src="/assets/images/marcon_desde_salgueiral.jpg"
              alt=""
            />
            <div className="mx-auto flex w-full max-w-3xl items-center justify-end pt-6">
              <Link
                href="/comuneros"
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
                <div className="-mt-16 flex flex-auto items-end">
                  <div className="ring-bg-card flex h-32 w-32 items-center justify-center overflow-hidden rounded-full ring-4">
                    <div className="flex h-full w-full items-center justify-center rounded bg-gray-200 text-8xl font-bold uppercase leading-none text-gray-600">
                      {initial}
                    </div>
                  </div>
                </div>

                {/* Nombre */}
                <FieldRow icon={<UserSolid className="h-5 w-5" />} label="Nombre y apellidos">
                  <input
                    {...register("name", { required: true })}
                    placeholder="Nombre y apellidos"
                    spellCheck={false}
                    className={inputCls}
                  />
                </FieldRow>

                {/* DNI */}
                <FieldRow icon={<CreditSolid className="h-5 w-5" />} label="DNI">
                  <input {...register("dni")} placeholder="DNI" className={inputCls} />
                </FieldRow>

                {/* Email */}
                <FieldRow icon={<AtSolid className="h-5 w-5" />} label="Email">
                  <input {...register("email")} placeholder="Email" className={inputCls} />
                </FieldRow>

                {/* Username */}
                <FieldRow icon={<UserSolid className="h-5 w-5" />} label="Nombre de usuario">
                  <input
                    {...register("username")}
                    placeholder="Nombre de usuario"
                    className={inputCls}
                  />
                </FieldRow>

                {/* Código */}
                <FieldRow icon={<MapPinIcon className="h-5 w-5" />} label="Nº de comunero">
                  <input {...register("code")} placeholder="Nº comunero" className={inputCls} />
                </FieldRow>

                {/* Lugar */}
                {lugares.length > 0 && (
                  <FieldRow icon={<HomeSolid className="h-5 w-5" />} label="Lugar">
                    <select {...register("lugarId")} className={inputCls}>
                      <option value="" />
                      {lugares.map((lugar) => (
                        <option key={lugar.id} value={lugar.id}>
                          {lugar.address}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                )}

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
                              className={inputCls}
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
                    onClick={() => append({ phoneNumber: "", label: "" })}
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    <span className="ml-2 font-medium text-secondary group-hover:underline">
                      Añadir otro teléfono
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="-mx-6 mt-10 flex items-center border-t bg-gray-50 py-4 pl-1 pr-4 sm:-mx-12 sm:pl-7 sm:pr-12">
                  {comunero.id && (
                    <button
                      type="button"
                      onClick={deleteComunero}
                      className="font-medium text-warn-600 hover:underline"
                    >
                      Borrar comunero
                    </button>
                  )}
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

      <StatusModal
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onConfirm={changeStatus}
      />
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
    <div className="mt-8">
      <label className="mb-1 block font-medium text-secondary">{label}</label>
      <div className="flex items-center gap-2">
        <span className="hidden text-gray-500 sm:block">{icon}</span>
        {children}
      </div>
    </div>
  );
}
