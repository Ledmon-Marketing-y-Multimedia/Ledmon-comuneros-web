# ---- Dependencias ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Variables NEXT_PUBLIC_* necesarias en build (se inyectan en el bundle cliente).
ARG NEXT_PUBLIC_API_URL
# El rewrite /api de next.config.ts se resuelve en build y queda escrito en
# .next/routes-manifest.json: si el destino no se fija aquí, la imagen se queda
# con el localhost:8080 del entorno de desarrollo.
ARG API_PROXY_TARGET
RUN npm run build

# ---- Runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# server.js escucha en $HOSTNAME, y Docker la fija al id del contenedor: sin esto
# solo se ata a la IP de eth0 y ni el healthcheck puede llamarse a sí mismo.
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
