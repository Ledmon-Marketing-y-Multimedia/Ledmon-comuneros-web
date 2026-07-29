"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useScanning } from "@/features/meetings/scanning-context";
import { QRScanner } from "@/features/meetings/qr-scanner";
import { ManualSearch } from "@/features/meetings/manual-search";
import {
  getAnnouncementAttendance,
  registerAttendance as registerAttendanceApi,
} from "@/features/meetings/api";
import type { MeetingAttendance } from "@/types/domain";

/**
 * Los tres desenlaces posibles de un escaneo, que es lo único que quien está en la
 * puerta necesita distinguir de un vistazo:
 *
 * - `registrado`: el QR ha entrado y la asistencia queda marcada.
 * - `repetido`: esa asistencia ya estaba registrada (alguien escaneó dos veces).
 * - `fallo`: el QR no corresponde a la reunión, o la API no ha podido con él.
 */
type TipoAviso = "registrado" | "repetido" | "fallo";

interface Aviso {
  tipo: TipoAviso;
  titulo: string;
  detalle: string;
}

/** Cuánto se queda cada aviso. El fallo aguanta más: hay que leerlo. */
const DURACION: Record<TipoAviso, number> = {
  registrado: 3000,
  repetido: 3000,
  fallo: 5000,
};

const ESTILO: Record<TipoAviso, { caja: string; icono: typeof CheckCircleIcon }> = {
  registrado: { caja: "border-green-400 bg-green-950/80", icono: CheckCircleIcon },
  repetido: { caja: "border-amber-400 bg-amber-950/80", icono: InformationCircleIcon },
  fallo: { caja: "border-red-400 bg-red-950/80", icono: ExclamationTriangleIcon },
};

export function MeetingShell({ children }: { children: React.ReactNode }) {
  const { scanning, setScanning } = useScanning();

  const [presentCount, setPresentCount] = useState(0);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [selecting, setSelecting] = useState<MeetingAttendance[] | null>(null);
  const [selectedAttendance, setSelectedAttendance] =
    useState<MeetingAttendance | null>(null);

  /**
   * Mientras se procesa un escaneo (o se muestra su aviso) se ignoran los
   * siguientes: la cámara dispara varias lecturas por segundo del mismo código.
   *
   * Es una `ref` y no estado porque las lecturas llegan más rápido de lo que React
   * re-renderiza, y porque **siempre** hay que poder liberarla: antes se limpiaba
   * solo en el camino feliz, así que un QR desconocido dejaba el escáner mudo hasta
   * cerrar y volver a abrir.
   */
  const procesando = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scanning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPresentCount(
        scanning.attendance?.filter((a) => a.status === "PRESENT").length ?? 0,
      );
    }
  }, [scanning]);

  // Escape cierra el overlay.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setScanning(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setScanning]);

  /**
   * Muestra un aviso y, al retirarlo, libera el escáner. Es el **único** sitio que
   * suelta `procesando`, así que no hay camino que deje el escaneo bloqueado.
   */
  const mostrarAviso = useCallback((siguiente: Aviso) => {
    setAviso(siguiente);

    if (temporizador.current) clearTimeout(temporizador.current);

    temporizador.current = setTimeout(() => {
      setAviso(null);
      procesando.current = false;
    }, DURACION[siguiente.tipo]);
  }, []);

  // Si se cierra el escáner con un aviso en pantalla, no dejamos el temporizador
  // suelto ni el guardia echado.
  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      procesando.current = false;
    },
    [],
  );

  const registerAttendance = (attendance: MeetingAttendance) => {
    const next = { ...attendance, status: "PRESENT" };
    procesando.current = true;
    setSelecting(null);

    registerAttendanceApi(next).then(
      (result) => {
        setPresentCount(result.filter((a) => a.status === "PRESENT").length);
        void new Audio("/assets/sounds/ping.mp3").play().catch(() => undefined);
        mostrarAviso({
          tipo: "registrado",
          titulo: next.comunero?.user?.name ?? "Asistencia registrada",
          detalle: "Asistencia registrada",
        });
      },
      (error) => {
        mostrarAviso({
          tipo: "fallo",
          titulo: "No se ha podido registrar",
          detalle:
            error instanceof Error && error.message
              ? error.message
              : "Inténtalo de nuevo o busca al comunero por su nombre.",
        });
      },
    );
  };

  const scanSuccessHandler = (text: string) => {
    if (procesando.current || selecting || !scanning?.id) return;

    procesando.current = true;

    getAnnouncementAttendance(scanning.id, text).then(
      (attendances) => {
        // El QR lleva la dirección del lugar, no un identificador: si no coincide
        // con ninguna, no hay a quién registrar. Antes esta rama estaba invertida y
        // llamaba a la API con `undefined`.
        if (attendances.length === 0) {
          mostrarAviso({
            tipo: "fallo",
            titulo: "QR no reconocido",
            detalle: `«${text}» no corresponde a ninguna dirección de esta reunión.`,
          });

          return;
        }

        // Varios titulares en la misma dirección: decide quien escanea.
        if (attendances.length > 1) {
          procesando.current = false;
          setSelecting(attendances);

          return;
        }

        const [attendance] = attendances;

        if (attendance.status === "PRESENT") {
          mostrarAviso({
            tipo: "repetido",
            titulo: attendance.comunero?.user?.name ?? "Ya registrado",
            detalle: "Esta asistencia ya estaba registrada.",
          });

          return;
        }

        registerAttendance(attendance);
      },
      (error) => {
        mostrarAviso({
          tipo: "fallo",
          titulo: "No se ha podido comprobar el QR",
          detalle:
            error instanceof Error && error.message
              ? error.message
              : "Revisa la conexión con el servidor.",
        });
      },
    );
  };

  return (
    <>
      {children}

      {scanning && (
        <div className="fixed inset-0 z-[250] h-screen overflow-hidden overflow-y-auto">
          <div className="mb-12 flex flex-col justify-center">
            <div className="z-50 p-5 text-xl text-white">
              Escaneo QR de la reunión {scanning.name}
            </div>

            <div className="absolute right-0 top-0 z-50 p-5">
              <button
                type="button"
                onClick={() => setScanning(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {aviso && <AvisoEscaneo aviso={aviso} />}

            <QRScanner onScan={scanSuccessHandler} />

            <div className="absolute inset-x-10 bottom-10 z-50 m-8 p-6 text-2xl text-white">
              <div className="z-50 flex h-full w-full flex-auto flex-col items-center justify-center gap-y-2 p-4">
                <div className="mt-4 text-center text-xl font-medium tracking-tight text-white">
                  Comuneros presentes: {presentCount}
                </div>
              </div>
            </div>

            <ManualSearch
              meetingId={scanning.id ?? ""}
              attendance={selectedAttendance}
              onRegister={registerAttendance}
            />

            {selecting && (
              <div className="filter-list z-50 m-auto bottom-0 left-0 flex w-full max-w-80 flex-col bg-card p-8 pt-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-semibold leading-tight">
                    ¿Quien asiste?
                  </div>
                </div>
                {selecting.map((att, i) => (
                  <div key={att.id || i} className="my-2 flex flex-col">
                    <div
                      onClick={() => registerAttendance(att)}
                      className="my-2 cursor-pointer hover:bg-slate-400"
                    >
                      <div>{att.comunero?.user?.name}</div>
                      <div className="text-md text-secondary">
                        {att.comunero?.user?.dni}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="my-2 flex flex-col">
                  <div
                    onClick={() => setSelectedAttendance(selecting[0])}
                    className="my-2 cursor-pointer hover:bg-slate-400"
                  >
                    <div>Añadir representante</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div
            style={{ boxShadow: "0 0 0 99999px rgba(0, 0, 0, .8)" }}
            className="scanning absolute inset-x-0 bottom-12 top-12 m-auto h-72 w-72 rounded-xl border-2 border-sky-500"
          />
        </div>
      )}
    </>
  );
}

/**
 * Aviso del escaneo. Un solo sitio, tres aspectos: el color y el icono son lo que
 * se lee a un metro de distancia, con la reunión llena de gente.
 */
function AvisoEscaneo({ aviso }: { aviso: Aviso }) {
  const { caja, icono: Icono } = ESTILO[aviso.tipo];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`z-50 mx-auto mt-4 flex w-full max-w-120 items-center gap-4 rounded-lg border-2 px-6 py-4 text-white ${caja}`}
    >
      <Icono className="h-12 w-12 shrink-0" />
      <div className="min-w-0 text-left">
        <div className="truncate text-xl font-medium tracking-tight">
          {aviso.titulo}
        </div>
        <div className="text-base text-white/80">{aviso.detalle}</div>
      </div>
    </div>
  );
}
