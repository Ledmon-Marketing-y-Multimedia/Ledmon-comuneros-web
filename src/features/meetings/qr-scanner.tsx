"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

const FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.CODE_128,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.AZTEC,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.CODABAR,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.UPC_EAN_EXTENSION,
  BarcodeFormat.EAN_8,
  BarcodeFormat.MAXICODE,
  BarcodeFormat.PDF_417,
  BarcodeFormat.ITF,
  BarcodeFormat.RSS_14,
  BarcodeFormat.RSS_EXPANDED,
];

/**
 * En qué punto está la cámara. Todo lo que no sea `escaneando` se explica en
 * pantalla: antes cualquier fallo acababa en un `console.error` y el usuario solo
 * veía un rectángulo negro.
 */
type Estado =
  | { tipo: "comprobando" }
  | { tipo: "escaneando" }
  | { tipo: "sin-camara" }
  | { tipo: "sin-permiso" }
  | { tipo: "ocupada" }
  | { tipo: "no-soportado" }
  | { tipo: "error"; detalle: string };

type TipoConAviso = Exclude<Estado["tipo"], "escaneando" | "comprobando" | "error">;

const AVISOS: Record<
  TipoConAviso,
  { titulo: string; descripcion: string; reintentar: boolean }
> = {
  "sin-camara": {
    titulo: "No hay cámara disponible",
    descripcion:
      "Este dispositivo no tiene ninguna cámara conectada. Puedes registrar la asistencia buscando al comunero por su nombre, abajo.",
    reintentar: true,
  },
  "sin-permiso": {
    titulo: "Falta permiso para usar la cámara",
    descripcion:
      "El navegador ha bloqueado el acceso. Permítelo en el icono de la barra de direcciones y vuelve a intentarlo.",
    reintentar: true,
  },
  ocupada: {
    titulo: "La cámara está ocupada",
    descripcion:
      "Otra aplicación la está usando. Ciérrala (una videollamada, otra pestaña con la cámara abierta) e inténtalo de nuevo.",
    reintentar: true,
  },
  "no-soportado": {
    titulo: "El navegador no da acceso a la cámara",
    descripcion:
      "Suele ser porque la página no se sirve por HTTPS: los navegadores solo permiten la cámara en páginas seguras o en localhost. Si entras por una dirección IP sin HTTPS, ese es el motivo. También puede ser un navegador que no admita esta función.",
    reintentar: false,
  },
};

/**
 * Traduce el fallo de `getUserMedia` a un estado. Se contemplan los nombres del
 * estándar y los antiguos de Chrome/Firefox, que algún navegador móvil devuelve.
 */
function clasificar(error: unknown): Estado {
  const nombre = error instanceof Error ? error.name : "";

  switch (nombre) {
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return { tipo: "sin-camara" };
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return { tipo: "sin-permiso" };
    // Lo devuelven los navegadores que no pueden ni pedir el permiso: contextos no
    // seguros y algunos WebView de Android (Chromium headless también).
    case "NotSupportedError":
      return { tipo: "no-soportado" };
    case "NotReadableError":
    case "TrackStartError":
      return { tipo: "ocupada" };
    default:
      return {
        tipo: "error",
        detalle: error instanceof Error ? error.message : String(error),
      };
  }
}

/**
 * Pide la cámara.
 *
 * `facingMode: { ideal: "environment" }` en vez de `"environment"` a secas: como
 * *preferencia* elige la trasera en el móvil, pero **acepta la que haya** en un
 * portátil. Con la forma estricta, una webcam que no se declare trasera hace
 * fallar `getUserMedia` con `NotFoundError` — que es justo lo que hacía
 * `decodeFromVideoDevice(undefined, …)` de @zxing/browser (construye
 * `{ facingMode: 'environment' }`), y el motivo de que el escáner no abriera.
 */
async function pedirCamara(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
    });
  } catch (error) {
    // Por si algún navegador sigue siendo quisquilloso con facingMode: se
    // reintenta sin preferencia antes de dar el fallo por bueno.
    if (error instanceof Error && error.name === "OverconstrainedError") {
      return navigator.mediaDevices.getUserMedia({ video: true });
    }

    throw error;
  }
}

/**
 * Escáner de códigos (equivalente a zxing-scanner). Llama a onScan con el texto
 * decodificado, respetando un intervalo mínimo entre lecturas.
 *
 * Abre la cámara que haya —la trasera si existe— y, cuando no puede, dice por qué
 * en pantalla y ofrece reintentar.
 */
export function QRScanner({
  onScan,
  delayBetweenScanSuccess = 1000,
}: {
  onScan: (text: string) => void;
  delayBetweenScanSuccess?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastScanRef = useRef(0);
  const onScanRef = useRef(onScan);
  const [estado, setEstado] = useState<Estado>({ tipo: "comprobando" });
  const [intento, setIntento] = useState(0);

  // El callback se guarda en una ref para que la cámara no se reinicie cada vez que
  // el padre re-renderiza con una función nueva.
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const reintentar = useCallback(() => {
    setEstado({ tipo: "comprobando" });
    setIntento((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;
    let controls: { stop: () => void } | undefined;
    let stream: MediaStream | undefined;

    const soltar = () => {
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };

    const arrancar = async () => {
      // Sin la API no hay nada que intentar: pasa en http:// fuera de localhost y
      // en navegadores antiguos.
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        if (!cancelado) setEstado({ tipo: "no-soportado" });

        return;
      }

      // Si el navegador ya sabe que no hay ninguna cámara, se dice sin lanzar el
      // diálogo de permiso. `enumerateDevices` no da etiquetas hasta que hay
      // permiso, pero sí revela cuántas entradas de vídeo existen.
      try {
        const dispositivos = await navigator.mediaDevices.enumerateDevices();

        if (
          dispositivos.length > 0 &&
          !dispositivos.some((d) => d.kind === "videoinput")
        ) {
          if (!cancelado) setEstado({ tipo: "sin-camara" });

          return;
        }
      } catch {
        // Si enumerateDevices falla, seguimos: ya lo dirá getUserMedia.
      }

      try {
        stream = await pedirCamara();
      } catch (error) {
        if (!cancelado) setEstado(clasificar(error));

        return;
      }

      if (cancelado) {
        stream.getTracks().forEach((track) => track.stop());

        return;
      }

      const video = videoRef.current;

      if (!video) return;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
      const reader = new BrowserMultiFormatReader(hints);

      try {
        // Se le entrega el stream ya abierto (y no `decodeFromVideoDevice`): así
        // las restricciones de cámara las decide este componente.
        controls = await reader.decodeFromStream(stream, video, (result) => {
          if (!result) return;

          const ahora = Date.now();
          if (ahora - lastScanRef.current < delayBetweenScanSuccess) return;

          lastScanRef.current = ahora;
          onScanRef.current(result.getText());
        });

        if (cancelado) soltar();
        else setEstado({ tipo: "escaneando" });
      } catch (error) {
        if (!cancelado) setEstado(clasificar(error));
      }
    };

    void arrancar();

    return () => {
      cancelado = true;
      soltar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  const aviso =
    estado.tipo === "escaneando" || estado.tipo === "comprobando" || estado.tipo === "error"
      ? null
      : AVISOS[estado.tipo];

  return (
    <>
      <video
        ref={videoRef}
        // `muted` y `playsInline`: sin ellos iOS no reproduce en línea (abriría el
        // vídeo a pantalla completa).
        muted
        playsInline
        // `bg-black`: cuando no hay imagen (sin cámara, o mientras se abre) el
        // vídeo es transparente y se veía la pantalla de la reunión por debajo del
        // aviso, como si el escáner estuviera roto.
        className="absolute top-0 w-auto min-h-full min-w-full max-w-none bg-black object-cover"
        style={{ height: "100vh", width: "100vw" }}
      />

      {estado.tipo === "comprobando" && (
        <div
          role="status"
          className="absolute inset-x-0 top-1/3 z-50 px-8 text-center text-lg text-white"
        >
          Abriendo la cámara…
        </div>
      )}

      {(aviso !== null || estado.tipo === "error") && (
        <div
          role="alert"
          className="absolute inset-x-4 top-1/4 z-50 mx-auto flex max-w-120 flex-col items-center gap-4 rounded-lg bg-black/70 p-8 text-center text-white"
        >
          {estado.tipo === "sin-camara" ? (
            <VideoCameraSlashIcon className="h-12 w-12" />
          ) : (
            <ExclamationTriangleIcon className="h-12 w-12" />
          )}

          <p className="text-xl font-medium">
            {aviso?.titulo ?? "No se ha podido abrir la cámara"}
          </p>
          <p className="text-base leading-6">
            {aviso?.descripcion ??
              `El navegador ha devuelto: ${estado.tipo === "error" ? estado.detalle : ""}`}
          </p>

          {(aviso?.reintentar ?? true) && (
            <Button variant="secondary" onClick={reintentar} className="bg-white/10">
              <ArrowPathIcon className="h-5 w-5" />
              <span>Volver a intentarlo</span>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
