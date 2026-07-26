"use client"

import { useState } from "react";
import type { FormEvent } from "react";

/**
 * @module supplier/components/SupplierForm
 * Supplier Form — create/edit supplier with all fields from PRD 5.13.
 *
 * Per PRD 5.13:
 *   - Nama (required), Kontak, Email, Alamat
 *   - Produk (array of base product codes)
 *   - Lead Time (hari), Aktif (boolean), Catatan
 *
 * "use client" — client-side form state + submission.
 */


import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Supplier, SupplierFormData } from "../types"

/* ─── SupplierForm Component ─── */

interface SupplierFormProps {
  initialData?: Supplier
  onSubmit: (data: SupplierFormData) => Promise<void>
  submitLabel?: string
}

export default function SupplierForm({ initialData, onSubmit, submitLabel = "Simpan" }: SupplierFormProps) {
  const [nama, setNama] = useState(initialData?.nama ?? "")
  const [kontak, setKontak] = useState(initialData?.kontak ?? "")
  const [email, setEmail] = useState(initialData?.email ?? "")
  const [alamat, setAlamat] = useState(initialData?.alamat ?? "")
  const [produkInput, setProdukInput] = useState(
    initialData?.produk?.join(", ") ?? ""
  )
  const [leadTimeHari, setLeadTimeHari] = useState(
    initialData?.leadTimeHari ?? 7
  )
  const [aktif, setAktif] = useState(initialData?.aktif ?? true)
  const [catatan, setCatatan] = useState(initialData?.catatan ?? "")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const produkArray = produkInput
        .split(",")
        .map((p) => p.trim().toUpperCase())
        .filter(Boolean)

      await onSubmit({
        nama,
        kontak,
        email,
        alamat,
        produk: produkArray,
        leadTimeHari,
        aktif,
        catatan,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nama */}
        <div className="space-y-2">
          <Label htmlFor="nama">Nama Supplier *</Label>
          <Input
            id="nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="PT. Supplier ABC"
            required
          />
        </div>

        {/* Kontak + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kontak">Kontak</Label>
            <Input
              id="kontak"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              placeholder="0812-xxxx-xxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="supplier@example.com"
            />
          </div>
        </div>

        {/* Alamat */}
        <div className="space-y-2">
          <Label htmlFor="alamat">Alamat</Label>
          <Textarea
            id="alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Alamat supplier..."
            rows={2}
          />
        </div>

        {/* Produk */}
        <div className="space-y-2">
          <Label htmlFor="produk">Produk (kode base product, pisah dengan koma)</Label>
          <Input
            id="produk"
            value={produkInput}
            onChange={(e) => setProdukInput(e.target.value)}
            placeholder="LB, M, S, XL"
          />
          <p className="text-xs text-muted-foreground">
            Contoh: LB, M, S, XL — kode produk yang disuplai supplier ini
          </p>
        </div>

        {/* Lead Time + Aktif */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="leadTime">Lead Time (hari)</Label>
            <Input
              id="leadTime"
              type="number"
              min={1}
              value={leadTimeHari}
              onChange={(e) => setLeadTimeHari(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              id="aktif"
              checked={aktif}
              onCheckedChange={setAktif}
            />
            <Label htmlFor="aktif" className="cursor-pointer">
              {aktif ? "Aktif" : "Non-aktif"}
            </Label>
          </div>
        </div>

        {/* Catatan */}
        <div className="space-y-2">
          <Label htmlFor="catatan">Catatan</Label>
          <Textarea
            id="catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan tambahan..."
            rows={2}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  )
}
