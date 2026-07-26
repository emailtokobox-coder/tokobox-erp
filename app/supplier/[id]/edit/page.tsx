"use client"

/**
 * @module app/supplier/[id]/edit/page
 * Edit Supplier Page — edit existing supplier.
 *
 * Architecture:
 *   Page (client) → getSupplierAction + updateSupplierAction → Supabase
 */


import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { SupplierForm } from "@/features/supplier"
import { getSupplierAction, updateSupplierAction } from "@/features/supplier/actions"
import type { SupplierFormData } from "@/features/supplier/types"
import { notFound } from "next/navigation"

export default function EditSupplierPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [supplier, setSupplier] = useState<Awaited<ReturnType<typeof getSupplierAction>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSupplierAction(params.id).then((data) => {
      if (data) {
        setSupplier(data)
      } else {
        notFound()
      }
      setLoading(false)
    })
  }, [params.id])

  const handleSubmit = async (data: SupplierFormData) => {
    const result = await updateSupplierAction(params.id, data)
    if (result) {
      router.push(`/supplier/${params.id}`)
    } else {
      alert("Gagal memperbarui supplier")
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </main>
    )
  }

  if (!supplier) {
    return notFound()
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Supplier</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui data supplier: {supplier.nama}
        </p>
      </div>

      <SupplierForm
        initialData={supplier}
        onSubmit={handleSubmit}
        submitLabel="Perbarui"
      />
    </main>
  )
}
