import { vi } from "vitest";

/**
 * Doble de `next/navigation`: en los tests no hay App Router, así que se
 * controlan la ruta y los params a mano y se espían las navegaciones.
 *
 *   vi.mock("next/navigation", () => import("@/test/navigation-double"));
 */

let pathname = "/";
let search = "";
let params: Record<string, string> = {};

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export function setLocation(nextPathname: string, nextSearch = ""): void {
  pathname = nextPathname;
  search = nextSearch;
}

export function setParams(next: Record<string, string>): void {
  params = next;
}

export function resetNavigation(): void {
  setLocation("/");
  setParams({});
  Object.values(router).forEach((fn) => fn.mockClear());
}

export function useRouter() {
  return router;
}

export function usePathname() {
  return pathname;
}

export function useSearchParams() {
  return new URLSearchParams(search);
}

export function useParams() {
  return params;
}
