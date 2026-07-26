"use client"

import { useState } from "react";
import type { FormEvent } from "react";

/**
 * @module inventory/components/HppTable
 * HPP Table — editable table of HPP per SKU with add/edit/delete actions.
 *
 * Per PRD 7.4:
 *   - SKU, Nama Produk, HPP, Updated At
 *   - Tambah/Edit/Hapus HPP manual
 */

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Plus, Trash2, Save } from "lucide-react"
import type { HppSku } from "../types"
import { saveHppAction, deleteHppAction } from "../actions"
import { formatRupiah } from "@/features/shared/utils/format"

/* ─── Edit Form Row ─── */

function EditRow({
  item,
  onSave,
  onCancel,
}: {
  item: { sku: string; namaProduk: string; hpp: string }
  onSave: (data: { sku: string; skuNormalized: string; hpp: number; namaProduk: string }) => void
  onCancel: () => void
}) {
  const [sku, setSku] = useState(item.sku)
  const [namaProduk, setNamaProduk] = useState(item.namaProduk)
  const [hpp, setHpp] = useState(item.hpp)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const skuNormalized = sku.toLowerCase().trim()
    await onSave({ sku, skuNormalized, hpp: Number(hpp) || 0, namaProduk })
    setSaving(false)
  }

  return (
    <TableRow>
      <TableCell>
        <Input value={sku} onChange={(e) => setSku(e.target.value)} className="h-8 text-xs" placeholder="SKU" />
      </TableCell>
      <TableCell>
        <Input value={namaProduk} onChange={(e) => setNamaProduk(e.target.value)} className="h-8 text-xs" placeholder="Nama Produk" />
      </TableCell>
      <TableCell>
        <Input type="number" value={hpp} onChange={(e) => setHpp(e.target.value)} className="h-8 text-xs" placeholder="0" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" className="size-7" onClick={handleSubmit} disabled={saving}>
            <Save className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7" onClick={onCancel}>
            <span className="text-xs">Batal</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

/* ─── HppTable Component ─── */

export default function HppTable({ items }: { items: HppSku[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ sku: string; namaProduk: string; hpp: string } | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newItem, setNewItem] = useState({ sku: "", namaProduk: "", hpp: "" })
  const [saving, setSaving] = useState(false)

  const startEdit = (item: HppSku) => {
    setEditingId(item.id ?? null)
    setEditData({ sku: item.sku, namaProduk: item.namaProduk, hpp: item.hpp.toString() })
    setIsAdding(false)
  }

  const startAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setNewItem({ sku: "", namaProduk: "", hpp: "" })
  }

  const handleSaveEdit = async (data: { sku: string; skuNormalized: string; hpp: number; namaProduk: string }) => {
    setSaving(true)
    await saveHppAction(data)
    setEditingId(null)
    setEditData(null)
    setIsAdding(false)
    setSaving(false)
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!newItem.sku) return
    setSaving(true)
    await saveHppAction({
      sku: newItem.sku,
      skuNormalized: newItem.sku.toLowerCase().trim(),
      hpp: Number(newItem.hpp) || 0,
      namaProduk: newItem.namaProduk,
    })
    setNewItem({ sku: "", namaProduk: "", hpp: "" })
    setIsAdding(false)
    setSaving(false)
  }

  const handleDelete = async (skuNormalized: string) => {
    if (!confirm("Hapus HPP untuk SKU ini?")) return
  await deleteHppAction(skuNormalized)
}

  return (
    <Card>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-medium">Daftar HPP per SKU</h3>
        <Button size="sm" onClick={startAdd} disabled={isAdding || saving}>
          <Plus className="size-4 mr-1" />
          Tambah SKU
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nama Produk</TableHead>
            <TableHead className="text-right">HPP</TableHead>
            <TableHead className="text-right">Updated</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Add Row */}
          {isAdding && (
            <form onSubmit={handleAdd}>
              <EditRow
                item={newItem}
                onSave={handleSaveEdit}
                onCancel={() => { setIsAdding(false); setNewItem({ sku: "", namaProduk: "", hpp: "" }) }}
              />
            </form>
          )}

          {/* Data Rows */}
          {items.length === 0 && !isAdding ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                Belum ada data HPP. Import file HPP atau tambah manual.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              if (editingId === item.id && editData) {
                return (
                  <EditRow
                    key={item.id}
                    item={editData}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                )
              }
              return (
                <TableRow key={item.id ?? item.skuNormalized}>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell className="text-sm">{item.namaProduk}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatRupiah(item.hpp)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground text-right">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("id-ID") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => startEdit(item)}>
                        <span className="text-xs">Edit</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7 text-destructive" onClick={() => handleDelete(item.skuNormalized)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
