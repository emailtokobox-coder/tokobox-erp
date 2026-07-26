export const ORDER_ROUTES = {
  list: "/pesanan",
  detail: (id: string) => `/pesanan/${id}`,
} as const
