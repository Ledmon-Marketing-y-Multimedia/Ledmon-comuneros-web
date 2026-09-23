/** Convención de claves de query para TanStack Query. */
export const queryKeys = {
  loginCheck: ["login-check"] as const,

  accounts: {
    all: ["accounts"] as const,
    list: () => ["accounts", "list"] as const,
    detail: (id: string) => ["accounts", "detail", id] as const,
  },

  comuneros: {
    all: ["comuneros"] as const,
    list: (name?: string, status?: string) =>
      ["comuneros", "list", { name: name ?? "", status: status ?? "" }] as const,
    detail: (id: string) => ["comuneros", "detail", id] as const,
  },

  lugares: {
    all: ["lugares"] as const,
    list: (address?: string) =>
      ["lugares", "list", { address: address ?? "" }] as const,
    detail: (id: string) => ["lugares", "detail", id] as const,
  },

  meetings: {
    all: ["meetings"] as const,
    list: (query?: string) =>
      ["meetings", "list", { query: query ?? "" }] as const,
    detail: (id: string) => ["meetings", "detail", id] as const,
    attendancesByLugar: (meetingId: string, lugarId: string) =>
      ["meetings", meetingId, "lugar", lugarId] as const,
    attendancesByName: (meetingId: string, name: string) =>
      ["meetings", meetingId, "attendances", { name }] as const,
    absents: (comunidadId: string) =>
      ["comunidad", comunidadId, "absents"] as const,
  },

  announcements: {
    all: ["announcements"] as const,
    list: (query?: string) =>
      ["announcements", "list", { query: query ?? "" }] as const,
    detail: (id: string) => ["announcements", "detail", id] as const,
  },
} as const;
