import { ScanningProvider } from "@/features/meetings/scanning-context";
import { MeetingShell } from "@/features/meetings/meeting-shell";

/** Shell de reuniones: provee el estado de escaneo y el overlay QR global. */
export default function ReunionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScanningProvider>
      <MeetingShell>
        <div className="relative flex flex-auto">{children}</div>
      </MeetingShell>
    </ScanningProvider>
  );
}
