"use client";

/** Modal de progreso durante la generación de PDFs (portado de loader-modal). */
export function LoaderModal({
  open,
  done,
  total,
}: {
  open: boolean;
  done: number;
  total: number;
}) {
  if (!open) return null;
  return (
    <div className="relative z-99" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500/75" />
      <div className="fixed inset-0 z-99 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Creando comunicaciones
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {done} / {total}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
