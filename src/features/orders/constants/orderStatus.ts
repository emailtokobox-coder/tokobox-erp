export const ORDER_STATUSES = [
  "Selesai / Normal",
  "Retur Sebagian",
  "Retur Full",
  "Batal",
] as const

export const ORDER_ROUTES = {
  list: "/pesanan",
  detail: (id: string) => `/pesanan/${id}`,
} as const
