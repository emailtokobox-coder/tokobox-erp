/**
 * @module orders/domain
 * OrderStatus — status enums and helper functions for orders.
 */

export type OrderStatusItem = "NORMAL" | "PARTIAL_RETURN" | "FULL_RETURN" | "BATAL"
export type OrderStatusFinal = "Selesai / Normal" | "Retur Sebagian" | "Retur Full" | "Batal"
export type OrderStatusIncome = "Sudah Cocok" | "Belum Ada Income" | "Tidak Perlu Income" | "Belum Ada Income / Estimasi"
export type OrderStatusProfit = "Sudah Dihitung" | "Belum Ada Income" | "Tidak Dihitung" | "Belum Ada Income / Estimasi"
export type OrderStatusHpp = "HPP Lengkap" | "HPP Sebagian" | "HPP Kosong" | "Tidak Perlu HPP / Batal"
