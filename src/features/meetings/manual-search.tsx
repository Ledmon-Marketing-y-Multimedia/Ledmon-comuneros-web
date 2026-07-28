"use client";

import { useEffect, useRef, useState } from "react";
import {
  XMarkIcon,
  UserCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { getAttendancesByName } from "@/features/meetings/api";
import type { MeetingAttendance } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field-row";

/**
 * Búsqueda manual de asistencia (portado de manual-search). Busca comuneros por
 * nombre, permite marcar representación y emite la asistencia a registrar.
 */
export function ManualSearch({
  meetingId,
  attendance,
  onRegister,
  debounce = 300,
  minLength = 2,
}: {
  meetingId: string;
  attendance?: MeetingAttendance | null;
  onRegister: (attendance: MeetingAttendance) => void;
  debounce?: number;
  minLength?: number;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [attendances, setAttendances] = useState<MeetingAttendance[]>([]);
  const [resultsEmpty, setResultsEmpty] = useState(false);
  const [selected, setSelected] = useState<MeetingAttendance | null>(null);
  const [representationOn, setRepresentationOn] = useState(false);
  const [representation, setRepresentation] = useState("");
  const debRef = useRef<ReturnType<typeof setTimeout>>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Cuando llega una asistencia (desde "añadir representante"), prefill + abrir.
  useEffect(() => {
    if (attendance) {
      setSearch(attendance.comunero?.user?.name ?? "");
      setSelected(attendance);
      setOpen(true);
    }
  }, [attendance]);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    if (!search || search.length < minLength) {
      setAttendances([]);
      setResultsEmpty(false);
      return;
    }
    debRef.current = setTimeout(() => {
      getAttendancesByName(meetingId, search).then((res) => {
        setAttendances(res);
        setResultsEmpty(res.length === 0);
      });
    }, debounce);
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, [search, meetingId, debounce, minLength]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const register = () => {
    if (!selected) return;
    onRegister({ ...selected, representation });
    setOpen(false);
    setSearch("");
    setSelected(null);
    setRepresentation("");
    setRepresentationOn(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute inset-x-10 bottom-2 z-50 m-8 flex items-center justify-center gap-2 rounded bg-primary p-6 font-medium text-white"
      >
        <PlusIcon className="h-5 w-5" />
        <span className="mr-1">Añadir manualmente</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] flex h-screen flex-col overflow-hidden bg-card shadow-lg">
          <div className="flex shrink-0 items-center bg-primary py-4 pl-6 pr-4 text-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-ml-1 mr-3 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="text-lg font-medium leading-10">
              Añadir manualmente
            </div>
          </div>

          <div className="relative flex flex-auto flex-col divide-y overflow-y-auto bg-card">
            <div className="mt-4 flex flex-col overflow-hidden rounded px-8">
              <p className="text-lg font-medium">Comunero</p>
              <p className="mb-6 text-secondary">
                Busca al comunero que asiste a la reunión
              </p>
              <div className="relative flex flex-col">
                <div className="flex items-center border-b border-gray-300">
                  <UserCircleIcon className="h-5 w-5 text-gray-500" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSelected(null);
                    }}
                    placeholder="Buscar comunero..."
                    className="w-full bg-transparent px-2 py-2 focus:outline-none"
                  />
                </div>
                {(attendances.length > 0 || resultsEmpty) && (
                  <div className="mt-1 rounded-b border-t shadow-md">
                    {resultsEmpty && (
                      <div className="px-6 py-2 text-md text-secondary">
                        No results found!
                      </div>
                    )}
                    <div className="mt-2 px-2 text-sm font-semibold tracking-wider text-secondary">
                      Comuneros
                    </div>
                    {attendances.map((att) => (
                      <button
                        type="button"
                        key={att.id || att.comunero?.id}
                        onClick={() => {
                          setSelected(att);
                          setSearch(att.comunero?.user?.name ?? "");
                          setAttendances([]);
                        }}
                        className="group relative mb-1 flex w-full items-center rounded-md px-6 py-2 text-md hover:bg-gray-100"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100">
                          <UserCircleIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-3 truncate">
                          {att.comunero?.user?.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="my-2 h-px bg-gray-200" />

              <p className="text-lg font-medium">Representante</p>
              <p className="mb-2 text-secondary">
                Viene otra persona en nombre del comunero
              </p>
              <label className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={representationOn}
                  onChange={(e) => setRepresentationOn(e.target.checked)}
                />
                Viene en representación
              </label>
              {representationOn && (
                <input
                  value={representation}
                  onChange={(e) => setRepresentation(e.target.value)}
                  placeholder="Nombre y apellidos del representante"
                  className={fieldClass}
                />
              )}

              <div className="-mx-8 mt-8 flex items-center justify-end border-t bg-gray-50 px-8 py-5">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Atrás
                </Button>
                <Button
                  disabled={!selected}
                  onClick={register}
                  className="ml-3 px-6"
                >
                  Registrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
