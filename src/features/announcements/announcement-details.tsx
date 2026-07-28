"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useComuneros } from "@/features/comuneros/api";
import {
  useAnnouncement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useSendAnnouncementEmail,
} from "@/features/announcements/api";
import { getFileByPath } from "@/features/files/api";
import { LoaderModal } from "@/features/announcements/loader-modal";
import { Button, ButtonLink } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { pdfService } from "@/lib/pdf/pdf-service";
import {
  ComuneroRole,
  LugarStatus,
  type Announcement,
  type Comunero,
} from "@/types/domain";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/ui/field-row";

const COMUNIDAD_ID = "a09b25f2-897b-4e33-bac5-d5e34f7245ce";
const FILTERS = ["todos", "altas", "suspensos"] as const;
type Filter = (typeof FILTERS)[number] | "";

function titleCase(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AnnouncementDetails({
  announcementId,
  isNew,
}: {
  announcementId?: string;
  isNew?: boolean;
}) {
  const router = useRouter();
  const { data: comuneros = [] } = useComuneros();
  const { data: announcement } = useAnnouncement(
    isNew ? "" : (announcementId ?? ""),
  );

  const createMut = useCreateAnnouncement();
  const updateMut = useUpdateAnnouncement();
  const emailMut = useSendAnnouncementEmail();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<Filter>("");
  const [selectedZona, setSelectedZona] = useState("all");
  const [includeEmailUsers, setIncludeEmailUsers] = useState(false);
  const editMode = !isNew && !!announcement;

  // Selección de comuneros por carta/email (ids).
  const [cartaIds, setCartaIds] = useState<string[]>([]);
  const [emailIds, setEmailIds] = useState<string[]>([]);

  // Bases (1:1 con el subscribe de comuneros$).
  const comunerosCarta = useMemo(
    () => comuneros.filter((c) => !c.emailCommunication),
    [comuneros],
  );
  const comunerosEmail = useMemo(
    () => comuneros.filter((c) => c.user?.email && c.emailCommunication),
    [comuneros],
  );
  const zonas = useMemo(
    () =>
      Array.from(
        new Set(comuneros.map((c) => c.lugar?.zona).filter(Boolean)),
      ),
    [comuneros],
  );

  // Contadores por filtro (portado de _calcNumberOfCards).
  const numberOfComunerosCarta: Record<string, number> = {};
  const numberOfComunerosEmail: Record<string, number> = {};
  FILTERS.forEach((filter) => {
    const holderCarta = comunerosCarta.filter(
      (c) => c.role === ComuneroRole.HOLDER,
    );
    const holderEmail = comunerosEmail.filter(
      (c) => c.role === ComuneroRole.HOLDER,
    );
    if (filter === "todos") {
      numberOfComunerosCarta[filter] = holderCarta.length;
      numberOfComunerosEmail[filter] = holderEmail.length;
    } else if (filter === "suspensos") {
      numberOfComunerosCarta[filter] = holderCarta.filter(
        (c) => c.lugar?.status === LugarStatus.SUSPENDED,
      ).length;
      numberOfComunerosEmail[filter] = holderEmail.filter(
        (c) => c.lugar?.status === LugarStatus.SUSPENDED,
      ).length;
    } else {
      numberOfComunerosCarta[filter] = holderCarta.filter(
        (c) => c.lugar?.status === LugarStatus.ACTIVE,
      ).length;
      numberOfComunerosEmail[filter] = holderEmail.filter(
        (c) => c.lugar?.status === LugarStatus.ACTIVE,
      ).length;
    }
    if (includeEmailUsers) {
      numberOfComunerosCarta[filter] += numberOfComunerosEmail[filter];
    }
  });

  // Cargar comunicación existente.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!announcement) return;
    setTitle(announcement.title ?? "");
    setContent(announcement.content ?? "");
    const carta = (announcement.comuneros ?? []).filter((c) => !c.user?.email);
    const email = (announcement.comuneros ?? []).filter((c) => c.user?.email);
    setCartaIds(carta.map((c) => c.id));
    setEmailIds(email.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcement?.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Filtrado de tarjetas (portado de _filterCards).
  const applyFilters = (
    filter: Filter,
    zona: string,
    includeEmail: boolean,
  ) => {
    let carta: Comunero[] = [];
    let email: Comunero[] = [];
    switch (filter) {
      case "todos":
        carta = comunerosCarta.filter((c) => c.role === ComuneroRole.HOLDER);
        email = comunerosEmail.filter((c) => c.role === ComuneroRole.HOLDER);
        break;
      case "suspensos":
        carta = comunerosCarta.filter(
          (c) =>
            c.role === ComuneroRole.HOLDER &&
            c.lugar?.status === LugarStatus.SUSPENDED,
        );
        email = comunerosEmail.filter(
          (c) =>
            c.role === ComuneroRole.HOLDER &&
            c.lugar?.status === LugarStatus.SUSPENDED,
        );
        break;
      case "altas":
        carta = comunerosCarta.filter(
          (c) =>
            c.role === ComuneroRole.HOLDER &&
            c.lugar?.status === LugarStatus.ACTIVE,
        );
        email = comunerosEmail.filter(
          (c) =>
            c.role === ComuneroRole.HOLDER &&
            c.lugar?.status === LugarStatus.ACTIVE,
        );
        break;
      default:
        // Intersección con la comunicación existente.
        if (announcement) {
          carta = comunerosCarta.filter((cc) =>
            announcement.comuneros?.some((c) => c.id === cc.id),
          );
          email = comunerosEmail.filter((ce) =>
            announcement.comuneros?.some((c) => c.id === ce.id),
          );
        }
        break;
    }
    if (zona !== "all") {
      carta = carta.filter((c) => c.lugar?.zona === zona);
      email = email.filter((c) => c.lugar?.zona === zona);
    }
    if (includeEmail) {
      carta = carta.concat(email);
    }
    setCartaIds(carta.map((c) => c.id));
    setEmailIds(email.map((c) => c.id));
  };

  const onFilterChange = (filter: Filter) => {
    setSelectedFilter(filter);
    applyFilters(filter, selectedZona, includeEmailUsers);
  };
  const onZonaChange = (zona: string) => {
    setSelectedZona(zona);
    applyFilters(selectedFilter, zona, includeEmailUsers);
  };
  const onIncludeEmailChange = (include: boolean) => {
    setIncludeEmailUsers(include);
    applyFilters(selectedFilter, selectedZona, include);
  };

  const byIds = (list: Comunero[], ids: string[]) =>
    list.filter((c) => ids.includes(c.id));

  const saveAnnouncement = () => {
    const cartaSel = byIds(comunerosCarta, cartaIds);
    const emailSel = byIds(comunerosEmail, emailIds);
    const payload: Announcement = {
      id: announcement?.id,
      title,
      content,
      comuneros: [...cartaSel, ...emailSel],
      comunidad: { id: COMUNIDAD_ID },
    };
    if (editMode && announcement?.id) {
      updateMut.mutate({ id: announcement.id, announcement: payload });
    } else {
      createMut.mutate(payload, {
        onSuccess: (created) => router.push(`/announcements/${created.id}`),
      });
    }
  };

  const sendEmail = () => {
    const emailSel = byIds(comunerosEmail, emailIds);
    emailMut.mutate({ id: announcement?.id, title, content, comuneros: emailSel });
  };

  // Impresión de comunicaciones (portado de printComunications).
  const [loaderOpen, setLoaderOpen] = useState(false);
  const [loaderDone, setLoaderDone] = useState(0);
  const [loaderTotal, setLoaderTotal] = useState(0);

  const printComunications = async () => {
    const cartaSel = byIds(comunerosCarta, cartaIds);
    const a =
      '<div style="background-color: #11ffee00;width: 100%; font-family: "Arial", sans-serif; font-style: normal;" class="ql-editor">' +
      content +
      "</div>";
    const blobs: Blob[] = [];
    setLoaderDone(0);
    setLoaderTotal(cartaSel.length);
    setLoaderOpen(true);

    let cuentasDocument: Blob | null = null;
    if (announcement?.meeting) {
      const cuentas = announcement.meeting.documents?.find(
        (doc) => doc.type === "Cuentas",
      );
      if (cuentas) {
        cuentasDocument = await getFileByPath(
          `${COMUNIDAD_ID}/${announcement.meeting.id}/${cuentas.name}`,
        );
      }
    }

    for (const comunero of cartaSel) {
      if (comunero.user) comunero.user.name = titleCase(comunero.user.name ?? "");
      if (comunero.lugar) {
        comunero.lugar.address = titleCase(comunero.lugar.address ?? "");
        comunero.lugar.poblacion = titleCase(comunero.lugar.poblacion ?? "");
      }
      const result = await pdfService.print(
        comunero,
        a,
        announcement?.meeting != undefined,
      );
      blobs.push(result as unknown as Blob);
      if (cuentasDocument) blobs.push(cuentasDocument);
      setLoaderDone((d) => d + 1);
    }

    await pdfService.combinePdf(blobs);
    setLoaderOpen(false);
  };

  const multiValue = (ids: string[]) => ids;

  return (
    <div className="flex min-w-0 flex-auto flex-col">
      <div className="flex flex-0 flex-col border-b bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8">
        <div className="min-w-0 flex-1">
          <h2 className="mt-2 truncate text-3xl font-extrabold leading-7 tracking-tight sm:leading-10 md:text-4xl">
            Comunicación
          </h2>
        </div>
      </div>

      <div className="p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Columna izquierda: título + contenido */}
          <div className="max-w-3xl">
            <div className="mt-4 flex flex-col overflow-hidden rounded bg-card p-8 pb-5 shadow">
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-secondary">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="title"
                  className={fieldClass}
                />
              </div>
              <div className="mt-6 flex flex-col gap-y-2">
                <label className="font-medium">Contenido</label>
                <RichTextEditor value={content} onChange={setContent} />
              </div>
            </div>
          </div>

          {/* Columna derecha: carta + email */}
          <div className="max-w-3xl">
            {/* Envío por carta */}
            <Section
              title="Envio a comuneros por carta"
              actionLabel="Imprimir comunicaciones"
              onAction={printComunications}
            >
              <FilterToggle
                filters={FILTERS}
                selected={selectedFilter}
                counts={numberOfComunerosCarta}
                onChange={onFilterChange}
              />
              <ZonaSelect
                zonas={zonas}
                value={selectedZona}
                onChange={onZonaChange}
              />
              <ComunerosMultiSelect
                label="Comuneros"
                options={comunerosCarta}
                value={multiValue(cartaIds)}
                onChange={setCartaIds}
              />
              <label className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeEmailUsers}
                  onChange={(e) => onIncludeEmailChange(e.target.checked)}
                />
                Incluir comuneros con email
              </label>
            </Section>

            {/* Envío por email */}
            <Section
              title="Envio a comuneros por email"
              actionLabel="Enviar por email"
              onAction={sendEmail}
            >
              <FilterToggle
                filters={FILTERS}
                selected={selectedFilter}
                counts={numberOfComunerosEmail}
                onChange={onFilterChange}
              />
              <ZonaSelect
                zonas={zonas}
                value={selectedZona}
                onChange={onZonaChange}
              />
              <ComunerosMultiSelect
                label="Comuneros"
                options={comunerosEmail}
                value={multiValue(emailIds)}
                onChange={setEmailIds}
              />
            </Section>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-end">
          <ButtonLink variant="ghost" href="/announcements">
            Cancelar
          </ButtonLink>
          <Button onClick={saveAnnouncement} className="ml-3 px-6">
            Guardar
          </Button>
        </div>
      </div>

      <LoaderModal open={loaderOpen} done={loaderDone} total={loaderTotal} />
    </div>
  );
}

function Section({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-col overflow-hidden rounded bg-card p-8 pb-5 shadow">
      <div className="flex flex-wrap items-center justify-between">
        <div className="truncate text-lg font-medium leading-6 tracking-tight">
          {title}
        </div>
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
      <div className="mt-4 flex flex-col">{children}</div>
    </div>
  );
}

function FilterToggle({
  filters,
  selected,
  counts,
  onChange,
}: {
  filters: readonly string[];
  selected: string;
  counts: Record<string, number>;
  onChange: (f: never) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter as never)}
          className={cn(
            "rounded border px-3 py-1.5",
            selected === filter
              ? "border-primary bg-primary-50"
              : "border-gray-300",
          )}
        >
          <span className="text-secondary capitalize">{filter}</span>
          <span className="ml-1.5 font-medium text-secondary">
            ({counts[filter] ?? 0})
          </span>
        </button>
      ))}
    </div>
  );
}

function ZonaSelect({
  zonas,
  value,
  onChange,
}: {
  zonas: (string | undefined)[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FilterSelect value={value} onValueChange={onChange} className="mt-4 sm:w-44">
      <option value="all">Todos los lugares</option>
      {zonas.map((z) => (
        <option key={String(z)} value={String(z)}>
          {z}
        </option>
      ))}
    </FilterSelect>
  );
}

function ComunerosMultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Comunero[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="mt-4 w-full">
      <label className="mb-1 block text-secondary">{label}</label>
      <select
        multiple
        value={value}
        onChange={(e) =>
          onChange(Array.from(e.target.selectedOptions, (o) => o.value))
        }
        className="h-40 w-full rounded border border-gray-300 p-2 focus:outline-none"
      >
        {options.map((comunero) => (
          <option key={comunero.id} value={comunero.id}>
            {comunero.user?.name}
          </option>
        ))}
      </select>
    </div>
  );
}
