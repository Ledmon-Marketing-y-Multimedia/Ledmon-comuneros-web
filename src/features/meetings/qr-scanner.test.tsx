import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * El lector de @zxing no puede decodificar vídeo en jsdom: se sustituye por un
 * doble que registra el stream que se le entrega. Lo que se prueba aquí es la
 * negociación con la cámara, que es donde estaba el fallo.
 */
const decodeFromStream = vi.fn();

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: class {
    decodeFromStream = decodeFromStream;
  },
}));

import { QRScanner } from "@/features/meetings/qr-scanner";

/** Stream de pega: solo necesita poder cerrarse. */
function fakeStream() {
  const track = { stop: vi.fn() };

  return {
    stream: { getTracks: () => [track] } as unknown as MediaStream,
    track,
  };
}

function conMediaDevices(mediaDevices: Partial<MediaDevices> | undefined) {
  Object.defineProperty(navigator, "mediaDevices", {
    value: mediaDevices,
    configurable: true,
    writable: true,
  });
}

/** Error con el `name` que devuelve el navegador (no basta con el mensaje). */
function errorDom(name: string): Error {
  const error = new Error(`simulado: ${name}`);
  error.name = name;

  return error;
}

const UNA_CAMARA = [{ kind: "videoinput" }] as MediaDeviceInfo[];

describe("QRScanner", () => {
  beforeEach(() => {
    decodeFromStream.mockReset();
    decodeFromStream.mockResolvedValue({ stop: vi.fn() });
  });

  afterEach(() => {
    conMediaDevices(undefined);
  });

  it("abre la cámara aceptando la que haya y prefiriendo la trasera", async () => {
    const { stream } = fakeStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    conMediaDevices({
      getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue(UNA_CAMARA),
    });

    render(<QRScanner onScan={vi.fn()} />);

    await waitFor(() => expect(decodeFromStream).toHaveBeenCalled());

    // La clave del arreglo: `ideal`, no una exigencia. Con `facingMode:
    // "environment"` a secas, cualquier webcam sin trasera daba NotFoundError.
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: { ideal: "environment" } },
    });
    expect(decodeFromStream.mock.calls[0][0]).toBe(stream);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("dice que no hay cámara cuando el dispositivo no tiene ninguna", async () => {
    const getUserMedia = vi.fn();
    conMediaDevices({
      getUserMedia,
      // Hay micrófono, pero ninguna entrada de vídeo.
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: "audioinput" }]),
    });

    render(<QRScanner onScan={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No hay cámara disponible",
    );
    // Y no se molesta al usuario con el diálogo de permiso.
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("traduce el NotFoundError del navegador a «no hay cámara»", async () => {
    conMediaDevices({
      getUserMedia: vi.fn().mockRejectedValue(errorDom("NotFoundError")),
      enumerateDevices: vi.fn().mockResolvedValue(UNA_CAMARA),
    });

    render(<QRScanner onScan={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No hay cámara disponible",
    );
  });

  it("distingue el permiso denegado de la cámara ocupada", async () => {
    conMediaDevices({
      getUserMedia: vi.fn().mockRejectedValue(errorDom("NotAllowedError")),
      enumerateDevices: vi.fn().mockResolvedValue(UNA_CAMARA),
    });

    const { unmount } = render(<QRScanner onScan={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falta permiso para usar la cámara",
    );
    unmount();

    conMediaDevices({
      getUserMedia: vi.fn().mockRejectedValue(errorDom("NotReadableError")),
      enumerateDevices: vi.fn().mockResolvedValue(UNA_CAMARA),
    });

    render(<QRScanner onScan={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La cámara está ocupada",
    );
  });

  it("avisa de que sin HTTPS no hay cámara", async () => {
    // Es lo que ocurre al abrir el front por http://<ip> desde el móvil: el
    // navegador no expone `mediaDevices` en un origen no seguro.
    conMediaDevices(undefined);

    render(<QRScanner onScan={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El navegador no da acceso a la cámara",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("HTTPS");
    // Reintentar no arreglaría nada aquí, así que no se ofrece.
    expect(
      screen.queryByRole("button", { name: /volver a intentarlo/i }),
    ).not.toBeInTheDocument();
  });

  it("trata NotSupportedError como navegador sin acceso, no como error crudo", async () => {
    // Lo devuelven los contextos no seguros y algunos WebView de Android (y el
    // Chromium headless con el permiso sin conceder, que es como se prueba).
    conMediaDevices({
      getUserMedia: vi.fn().mockRejectedValue(errorDom("NotSupportedError")),
      enumerateDevices: vi.fn().mockResolvedValue(UNA_CAMARA),
    });

    render(<QRScanner onScan={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El navegador no da acceso a la cámara",
    );
  });

  it("reintenta cuando se pulsa el botón", async () => {
    const { stream } = fakeStream();
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(errorDom("NotAllowedError"))
      .mockResolvedValueOnce(stream);
    conMediaDevices({
      getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue(UNA_CAMARA),
    });

    render(<QRScanner onScan={vi.fn()} />);

    await userEvent.click(
      await screen.findByRole("button", { name: /volver a intentarlo/i }),
    );

    await waitFor(() => expect(decodeFromStream).toHaveBeenCalled());
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("suelta la cámara al desmontarse", async () => {
    const { stream, track } = fakeStream();
    const stop = vi.fn();
    decodeFromStream.mockResolvedValue({ stop });
    conMediaDevices({
      getUserMedia: vi.fn().mockResolvedValue(stream),
      enumerateDevices: vi.fn().mockResolvedValue(UNA_CAMARA),
    });

    const { unmount } = render(<QRScanner onScan={vi.fn()} />);
    await waitFor(() => expect(decodeFromStream).toHaveBeenCalled());

    unmount();

    // Sin esto la luz de la cámara se queda encendida al cerrar el escáner.
    expect(stop).toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalled();
  });

  it("avisa mientras la cámara se abre", async () => {
    conMediaDevices({
      getUserMedia: vi.fn().mockReturnValue(new Promise(() => {})),
      enumerateDevices: vi.fn().mockResolvedValue(UNA_CAMARA),
    });

    render(<QRScanner onScan={vi.fn()} />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Abriendo la cámara…",
    );
  });
});
