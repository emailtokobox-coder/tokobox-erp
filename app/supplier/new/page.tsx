"use client"

/**
 * @module app/supplier/new/page
 * New Supplier Page — create new supplier.
 *
 * Architecture:
 *   Page (client) → createSupplierAction → Supabase "suppliers" table
 */


import { useRouter } from "next/navigation"
import { SupplierForm } from "@/features/supplier"
import { createSupplierAction } from "@/features/supplier/actions"
import type { SupplierFormData } from "@/features/supplier/types"

export default function NewSupplierPage() {
  const router = useRouter()

  const handleSubmit = async (data: SupplierFormData) => {
    const result = await createSupplierAction(data)
    if (result) {
      router.push(`/supplier/${result.id}`)
    } else {
      alert("Gagal membuat supplier")
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Supplier Baru</h1>
        <p className="text-sm text-muted-foreground">
          Tambah supplier baru ke daftar
        </p>
      </div>

      <SupplierForm onSubmit={handleSubmit} submitLabel="Buat Supplier" />
    </main>
  )
}
