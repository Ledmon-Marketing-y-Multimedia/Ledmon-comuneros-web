import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => import("@/test/api-double"));
vi.mock("next/navigation", () => import("@/test/navigation-double"));

/**
 * El escáner se sustituye por un botón: lo que se prueba aquí es **qué hace la
 * pantalla con lo que lee la cámara**, no la cámara (eso está en
 * `qr-scanner.test.tsx`). Así cada lectura es un clic, y se pueden encadenar.
 */
vi.mock("@/features/meetings/qr-scanner", () => ({
  QRScanner: ({ onScan }: { onScan: (texto: string) => void }) => (
    <>
      <button type="button" onClick={() => onScan("Rúa de Proba 1")}>
        escanear proba 1
      </button>
      <button type="button" onClick={() => onScan("Rúa Descoñecida 9")}>
        escanear desconocida
      </button>
      <button type="button" onClick={() => onScan("Rúa Compartida 2")}>
        escanear compartida
      </button>
    </>
  ),
}));

import { ApiError, lastCall, mockRoute, resetApiDouble } from "@/test/api-double";
import { resetNavigation } from "@/test/navigation-double";
import { renderWithProviders } from "@/test/harness";
import { MeetingShell } from "@/features/meetings/meeting-shell";
import { ScanningProvider, useScanning } from "@/features/meetings/scanning-context";
import type { Meeting, MeetingAttendance } from "@/types/domain";
import { useEffect } from "react";

const REUNION = { id: "m1", name: "Asamblea de proba" } as Meeting;

function asistencia(
  id: string,
  nombre: string,
  status: "ABSENT" | "PRESENT" = "ABSENT",
): MeetingAttendance {
  return {
    id,
    status,
    comunero: { id: `c-${id}`, user: { name: nombre, dni: `${id}X` } },
  } as MeetingAttendance;
}

/** Abre el escáner al montar, como hace el botón «Escanear QRs» de la ficha. */
function AbrirEscaner() {
  const { setScanning } = useScanning();

  useEffect(() => {
    setScanning(REUNION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function montar() {
  return renderWithProviders(
    <ScanningProvider>
      <AbrirEscaner />
      <MeetingShell>
        <div>ficha de la reunión</div>
      </MeetingShell>
    </ScanningProvider>,
  );
}

/** Rutas de asistencia: una dirección conocida, una compartida y el registro. */
function conAsistencias() {
  mockRoute("GET", "/attendance/m1/lugar/Rúa de Proba 1", () => [
    asistencia("a1", "Ana García"),
  ]);
  mockRoute("GET", "/attendance/m1/lugar/Rúa Descoñecida 9", () => []);
  mockRoute("GET", "/attendance/m1/lugar/Rúa Compartida 2", () => [
    asistencia("a2", "Bruno Pérez"),
    asistencia("a3", "Carla Rodríguez"),
  ]);
  mockRoute("PATCH", "/attendance/register", ({ body }) => {
    const enviada = body as MeetingAttendance;

    return [{ ...enviada, status: "PRESENT" }];
  });
}

describe("MeetingShell — escaneo de QR", () => {
  beforeEach(() => {
    resetApiDouble();
    resetNavigation();
    conAsistencias();
    // El sonido del ping no existe en jsdom.
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  });

  it("registra la asistencia y lo dice en verde", async () => {
    montar();

    await userEvent.click(
      await screen.findByRole("button", { name: "escanear proba 1" }),
    );

    const aviso = await screen.findByRole("status");
    expect(aviso).toHaveTextContent("Ana García");
    expect(aviso).toHaveTextContent("Asistencia registrada");
    expect(aviso.className).toContain("green");

    expect(lastCall("PATCH", "/attendance/register")?.ctx.body).toMatchObject({
      status: "PRESENT",
    });
    expect(screen.getByText("Comuneros presentes: 1")).toBeInTheDocument();
  });

  it("avisa en ámbar si esa asistencia ya estaba registrada", async () => {
    mockRoute("GET", "/attendance/m1/lugar/Rúa de Proba 1", () => [
      asistencia("a1", "Ana García", "PRESENT"),
    ]);

    montar();

    await userEvent.click(
      await screen.findByRole("button", { name: "escanear proba 1" }),
    );

    const aviso = await screen.findByRole("status");
    expect(aviso).toHaveTextContent("Ana García");
    expect(aviso).toHaveTextContent("ya estaba registrada");
    expect(aviso.className).toContain("amber");

    // Y no se vuelve a llamar al registro.
    expect(lastCall("PATCH", "/attendance/register")).toBeUndefined();
  });

  it("avisa en rojo cuando el QR no corresponde a la reunión", async () => {
    montar();

    await userEvent.click(
      await screen.findByRole("button", { name: "escanear desconocida" }),
    );

    const aviso = await screen.findByRole("status");
    expect(aviso).toHaveTextContent("QR no reconocido");
    expect(aviso).toHaveTextContent("Rúa Descoñecida 9");
    expect(aviso.className).toContain("red");
    expect(lastCall("PATCH", "/attendance/register")).toBeUndefined();
  });

  it("un QR desconocido no deja el escáner bloqueado", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    montar();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Esto es la regresión: antes el fallo dejaba `inProgress` en true para
    // siempre y no se podía volver a escanear sin cerrar el escáner.
    await user.click(await screen.findByRole("button", { name: "escanear desconocida" }));
    expect(await screen.findByRole("status")).toHaveTextContent("QR no reconocido");

    // Pasado el aviso, el siguiente escaneo sí se atiende.
    await vi.advanceTimersByTimeAsync(5100);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "escanear proba 1" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Ana García");
    vi.useRealTimers();
  });

  it("con varios titulares en la dirección, pregunta a quién registrar", async () => {
    montar();

    await userEvent.click(
      await screen.findByRole("button", { name: "escanear compartida" }),
    );

    expect(await screen.findByText("¿Quien asiste?")).toBeInTheDocument();
    expect(screen.getByText("Bruno Pérez")).toBeInTheDocument();
    expect(screen.getByText("Carla Rodríguez")).toBeInTheDocument();
    expect(lastCall("PATCH", "/attendance/register")).toBeUndefined();

    await userEvent.click(screen.getByText("Carla Rodríguez"));

    expect(await screen.findByRole("status")).toHaveTextContent("Carla Rodríguez");
  });

  it("si el registro falla, lo dice y deja seguir escaneando", async () => {
    mockRoute(
      "PATCH",
      "/attendance/register",
      () => new ApiError(404, "Not Found", { message: "Attendance not found" }),
    );

    montar();

    await userEvent.click(
      await screen.findByRole("button", { name: "escanear proba 1" }),
    );

    const aviso = await screen.findByRole("status");
    expect(aviso).toHaveTextContent("No se ha podido registrar");
    expect(aviso.className).toContain("red");
  });
});
