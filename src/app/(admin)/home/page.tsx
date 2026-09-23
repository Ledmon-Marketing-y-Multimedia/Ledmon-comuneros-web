import Link from "next/link";

/* eslint-disable @next/next/no-img-element */

/** Home / dashboard (portado 1:1 de modules/admin/home). */
export default function HomePage() {
  return (
    <div className="absolute inset-0 flex min-w-0 flex-col overflow-hidden">
      <div className="bg-white">
        <main className="isolate">
          {/* Hero section */}
          <div className="lg:py-22 relative isolate -z-10 my-auto h-screen overflow-hidden bg-gradient-to-b from-indigo-100/20 py-8">
            <div
              className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:-mr-80 lg:-mr-96"
              aria-hidden="true"
            />
            <div className="mx-auto max-w-7xl px-6 pb-4 lg:px-8">
              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Link
                  href="/reuniones"
                  className="relative flex h-26 flex-col overflow-hidden rounded-lg p-6 hover:opacity-75 lg:h-40 xl:w-auto"
                >
                  <span aria-hidden="true" className="absolute inset-0">
                    <img
                      src="https://www.solufincas.com/wp-content/uploads/2023/06/cuantos-vecinos-hacen-falta-para-convocar-reunion.jpeg"
                      alt=""
                      className="h-full w-full object-cover object-center"
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-800 opacity-50"
                  />
                  <span className="relative mt-auto text-center text-xl font-bold text-white">
                    Reuniones
                  </span>
                </Link>
              </section>

              <section className="mt-8 xl:mx-auto xl:max-w-7xl xl:px-8">
                <div className="mt-4 flow-root">
                  <div className="-my-2">
                    <div className="relative box-content h-60 overflow-x-auto py-2 xl:overflow-visible">
                      <div className="relative grid grid-cols-2 space-x-4 px-4 sm:px-6 lg:px-8 xl:gap-x-8 xl:space-x-0 xl:px-0">
                        <Link
                          href="/comuneros"
                          className="relative flex h-60 flex-col overflow-hidden rounded-lg p-6 hover:opacity-75"
                        >
                          <span aria-hidden="true" className="absolute inset-0">
                            <img
                              src="https://media.quincemil.com/imagenes/2023/09/01193525/ancianos_gallegos-1706x960.jpg"
                              alt=""
                              className="h-full w-full object-cover object-center"
                            />
                          </span>
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-800 opacity-50"
                          />
                          <span className="relative mt-auto text-center text-xl font-bold text-white">
                            Comuneros
                          </span>
                        </Link>
                        <Link
                          href="/lugares"
                          className="relative flex h-60 flex-col overflow-hidden rounded-lg p-6 hover:opacity-75"
                        >
                          <span aria-hidden="true" className="absolute inset-0">
                            <img
                              src="https://i.pinimg.com/originals/ff/6a/03/ff6a03e8a4b6264f79fa0c30f4ff3e8c.jpg"
                              alt=""
                              className="h-full w-full object-cover object-center"
                            />
                          </span>
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-800 opacity-50"
                          />
                          <span className="relative mt-auto text-center text-xl font-bold text-white">
                            Direcciones
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
                <Link
                  href="/announcements"
                  className="relative flex h-26 flex-col overflow-hidden rounded-lg p-6 hover:opacity-75 lg:h-40 xl:w-auto"
                >
                  <span aria-hidden="true" className="absolute inset-0">
                    <img
                      src="https://assets.easymailing.com/cms/2023/03/03105631/carta-informativa-ejemplo-twitter.jpg"
                      alt=""
                      className="h-full w-full object-cover object-center"
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-800 opacity-50"
                  />
                  <span className="relative mt-auto text-center text-xl font-bold text-white">
                    Comunicaciones
                  </span>
                </Link>
              </section>
            </div>
            <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-white sm:h-32" />
          </div>
        </main>
      </div>
    </div>
  );
}
