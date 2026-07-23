"use client";

import { api } from "@/lib/api";

const DOCUMENT_URL = "/document";

/** Devuelve la URL firmada del documento (GET /document?path=, texto). */
export function getFileUrlByPath(path: string): Promise<string> {
  return api.get<string>(DOCUMENT_URL, {
    params: { path },
    responseType: "text",
  });
}

/** Descarga el documento: pide la URL y luego hace fetch del blob (1:1 con fileService). */
export async function getFileByPath(path: string): Promise<Blob> {
  const url = await getFileUrlByPath(path);
  const res = await fetch(url);
  return res.blob();
}

/** Extensión en mayúsculas a partir del nombre del adjunto. */
export function getFileExtensionImage(attachment: {
  name?: string;
}): string | undefined {
  const split = attachment.name?.split(".");
  if (split) {
    const extension = split[split.length - 1];
    return extension.toUpperCase();
  }
  return undefined;
}
