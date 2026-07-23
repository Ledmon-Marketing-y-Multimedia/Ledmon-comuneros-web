"use client";

import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

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
 * Escáner de códigos (equivalente a zxing-scanner). Llama a onScan con el texto
 * decodificado, respetando un intervalo mínimo entre lecturas.
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

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
    const reader = new BrowserMultiFormatReader(hints);
    let controls: { stop: () => void } | undefined;
    let cancelled = false;

    const video = videoRef.current;
    if (video) {
      reader
        .decodeFromVideoDevice(undefined, video, (result) => {
          if (!result) return;
          const now = Date.now();
          if (now - lastScanRef.current < delayBetweenScanSuccess) return;
          lastScanRef.current = now;
          onScan(result.getText());
        })
        .then((c) => {
          if (cancelled) c.stop();
          else controls = c;
        })
        .catch((e) => console.error("QR scanner error", e));
    }

    return () => {
      cancelled = true;
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute top-0 w-auto min-h-full min-w-full max-w-none object-cover"
      style={{ height: "100vh", width: "100vw" }}
    />
  );
}
