"use client";

import { useEffect, useState } from "react";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useScanning } from "@/features/meetings/scanning-context";
import { QRScanner } from "@/features/meetings/qr-scanner";
import { ManualSearch } from "@/features/meetings/manual-search";
import {
  getAnnouncementAttendance,
  registerAttendance as registerAttendanceApi,
} from "@/features/meetings/api";
import type { MeetingAttendance } from "@/types/domain";

export function MeetingShell({ children }: { children: React.ReactNode }) {
  const { scanning, setScanning } = useScanning();

  const [presentCount, setPresentCount] = useState(0);
  const [meetingAttendance, setMeetingAttendance] =
    useState<MeetingAttendance | null>(null);
  const [selecting, setSelecting] = useState<MeetingAttendance[] | null>(null);
  const [selectedAttendance, setSelectedAttendance] =
    useState<MeetingAttendance | null>(null);
  const [inProgress, setInProgress] = useState(false);

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

  const registerAttendance = (attendance: MeetingAttendance) => {
    const next = { ...attendance, status: "PRESENT" };
    registerAttendanceApi(next).then(
      (result) => {
        setSelecting(null);
        setMeetingAttendance(next);
        setPresentCount(result.filter((a) => a.status === "PRESENT").length);
        const snd = new Audio("/assets/sounds/ping.mp3");
        void snd.play();
        setTimeout(() => {
          setMeetingAttendance(null);
          setInProgress(false);
        }, 3000);
      },
      (error) => console.error("Error registering attendance", error),
    );
  };

  const scanSuccessHandler = (text: string) => {
    if (inProgress || !scanning?.id) return;
    setInProgress(true);
    if (meetingAttendance) return;
    getAnnouncementAttendance(scanning.id, text).then((attendances) => {
      if (attendances.length) {
        setSelecting(attendances);
      } else {
        registerAttendance(attendances[0]);
      }
    });
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

            {meetingAttendance && (
              <div className="z-50 flex w-auto flex-col items-center justify-center gap-y-2 text-2xl text-white">
                <div className="z-50 flex h-full w-full flex-auto flex-col items-center justify-center gap-y-2 p-4">
                  <div className="mt-4 text-center text-xl font-medium tracking-tight text-white">
                    {meetingAttendance.comunero?.user?.name}
                  </div>
                  <CheckCircleIcon className="h-20 w-20 text-green-500" />
                </div>
              </div>
            )}

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
