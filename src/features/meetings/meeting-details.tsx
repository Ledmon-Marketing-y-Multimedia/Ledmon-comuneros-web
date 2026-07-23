"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  MagnifyingGlassIcon,
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

interface FormValues {
  name: string;
  description: string;
  status: string;
}

const ATTENDANCE_PAGE_SIZES = [5, 10, 20];

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

  // Tabla de asistencia: filtro + paginación.
  const [filter, setFilter] = useState("");
  const [attPage, setAttPage] = useState(0);
  const [attPageSize, setAttPageSize] = useState(5);

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
  const attStart = attPage * attPageSize;
  const attItems = filteredAttendance.slice(attStart, attStart + attPageSize);
  const attPageCount = Math.max(
    1,
    Math.ceil(filteredAttendance.length / attPageSize),
  );

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
            <button
              type="button"
              onClick={() => setScanning(meeting)}
              className="w-full rounded bg-primary px-6 py-2 font-medium text-white hover:bg-primary-600 md:ml-3 md:w-fit"
            >
              Escanear QRs
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="w-full rounded bg-primary px-6 py-2 font-medium text-white hover:bg-primary-600 md:ml-3 md:w-fit"
            >
              Subir documento de reunion
            </button>
            {!meeting.announcementId ? (
              <button
                type="button"
                onClick={createAnnouncement}
                className="w-full rounded bg-primary px-6 py-2 font-medium text-white hover:bg-primary-600 md:ml-3 md:w-fit"
              >
                Crear convocatoria
              </button>
            ) : (
              <Link
                href={`/announcements/${meeting.announcementId}`}
                className="w-full rounded bg-primary px-6 py-2 text-center font-medium text-white hover:bg-primary-600 md:ml-3 md:w-fit"
              >
                Ir a convocatoria
              </Link>
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
                  className="border-b border-gray-300 bg-transparent py-2 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="mt-4 flex flex-col">
                <label className="mb-1 text-secondary">Descripción</label>
                <textarea
                  {...register("description")}
                  placeholder="description"
                  className="border-b border-gray-300 bg-transparent py-2 focus:border-primary focus:outline-none"
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
                <div className="flex min-w-50 items-center rounded-full border border-gray-300 bg-white px-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  <input
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setAttPage(0);
                    }}
                    autoComplete="off"
                    placeholder="Buscar asistencia"
                    className="w-full bg-transparent px-2 py-2 focus:outline-none"
                  />
                </div>
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
                    {attItems.map((att, i) => (
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
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
                                att.status === "ABSENT"
                                  ? "bg-red-200 text-red-800"
                                  : "bg-green-200 text-green-800",
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
                  <div className="border-t p-8 text-center text-4xl font-semibold tracking-tight sm:p-16">
                    No hay asistencia
                  </div>
                )}
                <div className="flex items-center justify-end gap-4 border-t py-2">
                  <select
                    value={attPageSize}
                    onChange={(e) => {
                      setAttPageSize(Number(e.target.value));
                      setAttPage(0);
                    }}
                    className="rounded border border-gray-300 px-2 py-1"
                  >
                    {ATTENDANCE_PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={attPage === 0}
                      onClick={() => setAttPage((p) => Math.max(0, p - 1))}
                      className="rounded px-2 py-1 disabled:opacity-40"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      disabled={attPage >= attPageCount - 1}
                      onClick={() =>
                        setAttPage((p) => Math.min(attPageCount - 1, p + 1))
                      }
                      className="rounded px-2 py-1 disabled:opacity-40"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-end">
          <Link
            href="/reuniones"
            className="rounded px-4 py-2 font-medium hover:bg-gray-100"
          >
            Cancelar
          </Link>
          <button
            type="button"
            disabled={!formState.isValid && formState.isSubmitted}
            onClick={handleSubmit(onSubmit)}
            className="ml-3 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
          >
            Guardar
          </button>
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
