"use client";

import { createContext, useContext, useState } from "react";
import type { Meeting } from "@/types/domain";

interface ScanningContextValue {
  scanning: Meeting | null;
  setScanning: (meeting: Meeting | null) => void;
}

const ScanningContext = createContext<ScanningContextValue | null>(null);

export function useScanning(): ScanningContextValue {
  const ctx = useContext(ScanningContext);
  if (!ctx) {
    throw new Error("useScanning debe usarse dentro de ScanningProvider");
  }
  return ctx;
}

export function ScanningProvider({ children }: { children: React.ReactNode }) {
  const [scanning, setScanning] = useState<Meeting | null>(null);
  return (
    <ScanningContext.Provider value={{ scanning, setScanning }}>
      {children}
    </ScanningContext.Provider>
  );
}
