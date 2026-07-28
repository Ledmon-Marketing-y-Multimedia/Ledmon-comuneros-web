This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tests

```bash
npm test          # vitest run (una pasada)
npm run test:watch
```

Son tests de componentes con jsdom (Vitest + Testing Library). No hay servidor de
Next: los componentes de cliente se montan directamente y la API se simula con el
doble de `@/lib/api` (`src/test/api-double.ts`), así que la capa de datos real
—los hooks de cada `features/<recurso>/api.ts`— sí se ejercita. `next/navigation`
también tiene su doble (`src/test/navigation-double.ts`) para controlar la ruta y
espiar las navegaciones. Helper de montaje: `src/test/harness.tsx`.

## Componentes compartidos

`src/components/ui/` tiene las piezas que repetían todas las pantallas: `Button` /
`ButtonLink`, `SearchInput`, `FilterSelect`, `StatusBadge`, `EmptyState`,
`Paginator` y `ListTable` (cabecera + filas + paginador de un listado), el
`Modal` con su `ModalFooter`, y las piezas de los paneles de detalle
(`DetailCover`, `DetailAvatar`, `InfoRow`, `FieldRow`, `FormActions`). La
paginación en cliente vive en `src/lib/use-pagination.ts`.

Antes de escribir marcado nuevo en una pantalla, mirar si ya está aquí: el
criterio es que una clase repetida en dos sitios acaba divergiendo (había
botones con `rounded` y `rounded-md`, y filas de formulario con y sin mensaje de
error).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
