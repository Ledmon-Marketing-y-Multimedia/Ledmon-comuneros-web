"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  DocumentIcon,
  XMarkIcon,
  CalendarIcon,
} from "@heroicons/react/24/solid";
import {
  useMeeting,
  useCreateMeeting,
  useUpdateMeeting,
  useUploadDocument,
  useDeleteDocument,
  COMUNIDAD_ID,
} from "@/features/meetings/api";
import { useCreateAnnouncement } from "@/features/announcements/api";
import { getFileUrlByPath, getFileExtensionImage } from "@/features/files/api";
import { useConfirmation } from "@/components/ui/confirmation";
import { useScanning } from "@/features/meetings/scanning-context";
import { UploadDocumentModal } from "@/features/meetings/upload-document-modal";
import {
  registerAttendance as registerAttendanceApi,
} from "@/features/meetings/api";
import {
  attendanceLabel,
  type Meeting,
  type MeetingAttendance,
  type MeetingDocument,
} from "@/types/domain";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldClass } from "@/components/ui/field-row";
import { Paginator } from "@/components/ui/paginator";
import { SearchInput } from "@/components/ui/search-input";
import { badgeClass } from "@/components/ui/status-badge";
import { usePagination } from "@/lib/use-pagination";

interface FormValues {
  name: string;
  description: string;
  status: string;
}

const ATTENDANCE_PAGE_SIZES = [5, 10, 20];

/** Acciones de la cabecera: a ancho completo en móvil, en fila en escritorio. */
const ACTION_CLASS = "w-full px-6 md:ml-3 md:w-fit";

function toDateInput(d?: Date | string | null): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function MeetingDetails({
  meetingId,
  isNew,
}: {
  meetingId?: string;
  isNew?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirmation();
  const { setScanning } = useScanning();

  const { data: fetched } = useMeeting(isNew ? "" : (meetingId ?? ""));
  const meeting: Meeting = isNew
    ? { attendance: [], documents: [] }
    : (fetched ?? { attendance: [], documents: [] });
  const editMode = !isNew && meeting.id !== undefined;

  const createMut = useCreateMeeting();
  const updateMut = useUpdateMeeting();
  const uploadMut = useUploadDocument();
  const deleteDocMut = useDeleteDocument();
  const createAnnouncementMut = useCreateAnnouncement();

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { name: "", description: "", status: "" },
  });

  const [date, setDate] = useState("");
  const [attendance, setAttendance] = useState<MeetingAttendance[]>([]);
  const [documents, setDocuments] = useState<MeetingDocument[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Tabla de asistencia: filtro por nombre (la paginación va más abajo, ya
  // sobre la lista filtrada).
  const [filter, setFilter] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    reset({
      name: meeting.name ?? "",
      description: meeting.description ?? "",
      status: meeting.status ?? "",
    });
    setDate(toDateInput(meeting.date));
    setAttendance(meeting.attendance ?? []);
    setDocuments(meeting.documents ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetched, isNew]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;

  const filteredAttendance = useMemo(
    () =>
      attendance.filter((a) =>
        (a.comunero?.user?.name ?? "")
          .toLowerCase()
          .includes(filter.trim().toLowerCase()),
      ),
    [attendance, filter],
  );
  const attPagination = usePagination(filteredAttendance, 5);

  const onSubmit = (values: FormValues) => {
    const payload: Meeting = {
      id: meeting.id,
      name: values.name,
      description: values.description,
      status: values.status,
      date: date ? (new Date(date) as unknown as Date) : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ comunidad: { id: COMUNIDAD_ID } } as any),
    };
    if (editMode && meeting.id) {
      updateMut.mutate({ id: meeting.id, meeting: payload });
    } else {
      createMut.mutate(payload, {
        onSuccess: (created) => router.push(`/reuniones/${created.id}`),
      });
    }
  };

  const togglePresence = (att: MeetingAttendance) => {
    const next: MeetingAttendance & { meetingId?: string } = {
      ...att,
      status: att.status === "PRESENT" ? "ABSENT" : "PRESENT",
      entryDate: new Date(),
      meetingId: meeting.id,
    };
    registerAttendanceApi(next).then(() => {
      setAttendance((prev) =>
        prev.map((a) => (a.id === att.id ? { ...a, ...next } : a)),
      );
    });
  };

  const uploadActa = (doc: { type: string; file: File }) => {
    if (!meeting.id) return;
    const formData = new FormData();
    formData.append("file", doc.file);
    const document = {
      name: doc.file.name,
      type: doc.type,
      comunidad: { id: COMUNIDAD_ID },
    };
    formData.append(
      "document",
      new Blob([JSON.stringify(document)], { type: "application/json" }),
    );
    uploadMut.mutate(
      { meetingId: meeting.id, formData },
      {
        onSuccess: (response) =>
          setDocuments((prev) => [...prev, response as MeetingDocument]),
      },
    );
  };

  const deleteDocument = async (doc: MeetingDocument) => {
    const ok = await confirm({
      title: "Borrar documento",
      message:
        "¿Estás seguro de que quieres borrar este documento? ¡Esta acción no se puede deshacer!",
      actions: { confirm: { label: "Borrar" } },
    });
    if (ok && meeting.id && doc.id) {
      deleteDocMut.mutate(
        { meetingId: meeting.id, documentId: doc.id },
        {
          onSuccess: () =>
            setDocuments((prev) => prev.filter((d) => d.id !== doc.id)),
        },
      );
    }
  };

  const getDocument = (doc: MeetingDocument) => {
    getFileUrlByPath(`${COMUNIDAD_ID}/${meeting.id}/${doc.name}`).then((url) =>
      window.open(url, "_blank"),
    );
  };

  const createAnnouncement = () => {
    const dateStr = meeting.date
      ? new Date(meeting.date).toLocaleDateString()
      : "";
    createAnnouncementMut.mutate(
      {
        title: "Convocatoria reunión " + dateStr,
        meeting,
        comunidad: { id: COMUNIDAD_ID },
      },
      { onSuccess: (a) => router.push("/announcements/" + a.id) },
    );
  };

  return (
    <div className="flex min-w-0 flex-auto flex-col">
      <div className="flex flex-0 flex-col border-b bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8">
        <div className="min-w-0 flex-1">
          <h2 className="mt-2 truncate text-3xl font-extrabold leading-7 tracking-tight sm:leading-10 md:text-4xl">
            Reunión
          </h2>
        </div>
      </div>

      <div className="p-6 sm:p-10">
        {editMode && (
          <div className="flex flex-wrap items-center justify-end gap-y-2">
            <Button onClick={() => setScanning(meeting)} className={ACTION_CLASS}>
              Escanear QRs
            </Button>
            <Button onClick={() => setUploadOpen(true)} className={ACTION_CLASS}>
              Subir documento de reunion
            </Button>
            {!meeting.announcementId ? (
              <Button onClick={createAnnouncement} className={ACTION_CLASS}>
                Crear convocatoria
              </Button>
            ) : (
              <ButtonLink
                href={`/announcements/${meeting.announcementId}`}
                className={ACTION_CLASS}
              >
                Ir a convocatoria
              </ButtonLink>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Información + documentos */}
          <div>
            <div className="mt-4 flex flex-col overflow-hidden rounded bg-card p-8 pb-5 shadow">
              <h2 className="text-3xl font-semibold leading-8 tracking-tight">
                Información de la reunión
              </h2>
              <div className="mt-2 flex flex-col">
                <label className="mb-1 text-secondary">Título</label>
                <input
                  {...register("name", { required: true })}
                  placeholder="name"
                  className={fieldClass}
                />
              </div>
              <div className="mt-4 flex flex-col">
                <label className="mb-1 text-secondary">Descripción</label>
                <textarea
                  {...register("description")}
                  placeholder="description"
                  className={fieldClass}
                />
              </div>
              <div className="mt-4">
                <div className="font-medium">Fecha</div>
                <div
                  className={cn(
                    "mt-1.5 flex items-center gap-2 rounded-full px-4 leading-9",
                    date
                      ? "bg-green-200 text-green-800"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  <CalendarIcon className="h-5 w-5" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent py-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {documents.length > 0 && (
              <div className="mt-4 flex flex-col overflow-hidden rounded bg-card p-8 pb-5 shadow">
                <h2 className="text-3xl font-semibold leading-8 tracking-tight">
                  Documentos
                </h2>
                <div className="-m-2 mt-2 flex flex-wrap">
                  {documents.map((document) => {
                    const extension = getFileExtensionImage(document);
                    return (
                      <div
                        key={document.id || document.name}
                        onClick={() => getDocument(document)}
                        className="relative m-2 flex h-30 w-30 cursor-pointer flex-col rounded-2xl border bg-card p-3 hover:bg-gray-100"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteDocument(document);
                          }}
                          className="absolute right-1.5 top-1.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                        <div className="aspect-[9/6]">
                          <div className="flex h-full items-center justify-center">
                            <div className="relative">
                              <DocumentIcon className="h-14 w-14 text-hint opacity-50" />
                              {extension && (
                                <div
                                  className={cn(
                                    "absolute bottom-0 left-0 rounded px-1.5 text-sm font-semibold leading-5 text-white",
                                    extension === "PDF"
                                      ? "bg-red-600"
                                      : extension === "DOC"
                                        ? "bg-blue-600"
                                        : extension === "XLS"
                                          ? "bg-green-600"
                                          : extension === "TXT"
                                            ? "bg-gray-600"
                                            : extension === "JPG"
                                              ? "bg-amber-600"
                                              : "bg-black",
                                  )}
                                >
                                  {extension}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-auto flex-col justify-center text-center text-sm font-medium">
                          <div className="truncate">{document.type}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Asistencia */}
          {attendance.length > 0 && (
            <div className="mt-4 overflow-hidden rounded bg-card p-8 pb-5 shadow">
              <h2 className="text-3xl font-semibold leading-8 tracking-tight">
                Asistencia
              </h2>
              <div className="flex flex-auto">
                <span>{presentCount} asistentes</span>
              </div>
              <div className="mt-2 flex-auto">
                <SearchInput
                  value={filter}
                  onValueChange={(value) => {
                    setFilter(value);
                    attPagination.reset();
                  }}
                  placeholder="Buscar asistencia"
                  className="min-w-50"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full bg-transparent">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2">Nombre y apellidos</th>
                      <th className="py-2">Estado</th>
                      <th className="py-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attPagination.pageItems.map((att, i) => (
                      <tr key={att.id || i} className="h-16">
                        <td>
                          <span className="whitespace-nowrap pr-6 text-sm font-medium text-secondary">
                            {att.comunero?.user?.name}
                          </span>
                        </td>
                        <td>
                          {att.status && (
                            <button
                              type="button"
                              onClick={() => togglePresence(att)}
                              className={badgeClass(
                                att.status === "ABSENT" ? "negative" : "positive",
                              )}
                            >
                              <span className="whitespace-nowrap leading-relaxed">
                                {attendanceLabel(att.status)}
                              </span>
                            </button>
                          )}
                        </td>
                        <td>
                          <span className="whitespace-nowrap pr-6 text-sm font-medium text-secondary">
                            {att.entryDate
                              ? new Date(att.entryDate).toLocaleString("es-ES")
                              : ""}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAttendance.length === 0 && (
                  <EmptyState message="No hay asistencia" />
                )}
                <Paginator
                  pagination={attPagination}
                  options={ATTENDANCE_PAGE_SIZES}
                  compact
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-end">
          <ButtonLink href="/reuniones" variant="ghost">
            Cancelar
          </ButtonLink>
          <Button
            disabled={!formState.isValid && formState.isSubmitted}
            onClick={handleSubmit(onSubmit)}
            className="ml-3 px-6"
          >
            Guardar
          </Button>
        </div>
      </div>

      <UploadDocumentModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onConfirm={uploadActa}
      />
    </div>
  );
}
