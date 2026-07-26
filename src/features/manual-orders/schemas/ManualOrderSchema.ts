/**
 * @module manual-orders/schemas
 * Zod validation schemas for Manual Orders feature.
 *
 * Provides runtime validation for order data before server action execution.
 *
 * Usage:
 *   import { manualOrderSchema } from "@/features/manual-orders/schemas"
 *   const result = manualOrderSchema.safeParse(data)
 */

import { z } from "zod"

// ─── Manual Order Item Schema ───

export const manualOrderItemSchema = z.object({
  id: z.string().optional(),
  namaProduk: z.string().min(1, "Nama produk harus diisi"),
  qty: z.number().int().positive("Qty harus lebih besar dari 0"),
  hargaSatuan: z.number().int().positive("Harga satuan harus lebih besar dari 0"),
  beratGram: z.number().int().nonnegative("Berat gram tidak boleh negatif").optional(),
  subtotal: z.number().nonnegative("Subtotal tidak boleh negatif").optional(),
})

// ─── Termin Schedule Entry Schema ───

export const terminScheduleEntrySchema = z.object({
  persentase: z.number().min(0).max(100),
  nominal: z.number().min(0),
  tanggalJatuhTempo: z.string().optional(),
})

// ─── Manual Order Schema ───

export const manualOrderSchema = z.object({
  // Customer info
  namaPelanggan: z
    .string()
    .min(2, "Nama pelanggan minimal 2 karakter")
    .trim(),
  alamat: z
    .string()
    .min(10, "Alamat minimal 10 karakter")
    .trim()
    .optional()
    .default(""),
  noHp: z
    .string()
    .regex(/^\d{8,}$/, "Nomor HP minimal 8 digit angka")
    .trim(),
  ekspedisi: z.string().optional().default(""),

  // Order type & payment
  tipePesanan: z.enum(["MANUAL_CASH", "MANUAL_DP", "MANUAL_TERMIN"]),
  metodePembayaran: z.enum(["cash", "transfer", "qris"]),
  statusOrder: z.string().optional().default("Draft"),

  // Items (required, min 1)
  items: z
    .array(manualOrderItemSchema)
    .min(1, "Pesanan harus memiliki minimal 1 item"),

  // Financial
  diskonPersen: z.number().min(0).max(100).default(0),
  diskonNominal: z.number().min(0).default(0),
  pajak: z.number().min(0).default(0),
  biayaOngkir: z.number().min(0).default(0),

  // Calculated totals
  total: z.number().nonnegative("Total tidak boleh negatif"),
  subtotal: z.number().nonnegative("Subtotal tidak boleh negatif"),
  totalBayar: z.number().min(0).default(0),
  sisaPembayaran: z.number().min(0).default(0),

  // DP fields (conditional)
  dpPersentase: z.number().min(1).max(100).optional(),
  dpNominal: z.number().min(0).optional(),

  // Termin schedule (conditional)
  terminSchedule: z.array(terminScheduleEntrySchema).optional(),

  // Notes
  catatan: z.string().optional().default(""),
})

// ─── Partial Order Schema (for updates) ───

export const partialManualOrderSchema = manualOrderSchema.partial()

// ─── Validation Result Types ───

export interface ValidationError {
  field: string
  message: string
}

export function parseWithErrors(schema: typeof manualOrderSchema, data: unknown): {
  success: boolean
  data?: z.infer<typeof manualOrderSchema>
  errors?: ValidationError[]
} {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  // ZodError.format() returns nested { field: { _errors: string[] } }
  const formatted = result.error.format()
  const errorList: ValidationError[] = []
  for (const [field, err] of Object.entries(formatted)) {
    if (field === "_errors") continue
    const entry = err as { _errors?: string[] }
    if (entry._errors && entry._errors.length > 0) {
      errorList.push({ field, message: entry._errors[0] })
    }
  }
  return {
    success: false,
    errors: errorList.length > 0 ? errorList : [{ field: "_form", message: "Validasi gagal" }],
  }
}
