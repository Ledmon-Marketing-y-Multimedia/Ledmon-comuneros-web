import Image from "next/image";

/** Pantalla de carga (equivalente al splash-screen de Fuse). */
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-99999 flex flex-col items-center justify-center bg-white">
      <Image
        src="/assets/images/logo.png"
        alt="Comunidad de Montes de Marcón"
        width={220}
        height={60}
        priority
        className="w-56"
      />
      <div className="mt-8 h-1 w-40 overflow-hidden rounded bg-gray-200">
        <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] bg-primary" />
      </div>
    </div>
  );
}
