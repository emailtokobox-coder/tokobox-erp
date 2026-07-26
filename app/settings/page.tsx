"use client"

import { useState, useEffect } from "react";
import type { FormEvent } from "react";

/**
 * @module app/settings/page
 * Settings Page — tabbed interface for store profile, backup, users, and app settings.
 *
 * Per PRD 7.11:
 *   - Profil Toko: Nama Toko, Alamat, No. Telepon, Marketplace Rate %, Mata Uang
 *   - Backup Manager: Backup triggers + history
 *   - User Management: CRUD users + role assignment
 *   - App Settings: Default min stok hari, Theme, Language
 */


import { Save, Plus, Trash2, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { StoreProfile, UserAccount, UserRole, BackupRecord, BackupType } from "@/features/settings/types"
import {
  updateStoreProfileAction,
  updateAppSettingsAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  triggerBackupAction,
  getBackupHistoryAction,
  getUsersAction,
} from "@/features/settings/actions"

/* ─── Profile Tab ─── */

function ProfileTab() {
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StoreProfile | null>(null)

  useEffect(() => {
    fetch("/api/settings/profile")
      .then(r => r.ok ? r.json() : null)
      .then(setProfile)
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      await updateStoreProfileAction({
        namaToko: formData.get("namaToko") as string,
        alamat: formData.get("alamat") as string,
        noTelepon: formData.get("noTelepon") as string,
        marketplaceRatePct: Number(formData.get("marketplaceRatePct")),
        currency: formData.get("currency") as string,
      })
      alert("Profil toko berhasil disimpan!")
    } catch {
      alert("Gagal menyimpan profil")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Toko</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nama Toko</label>
            <Input name="namaToko" defaultValue={profile?.namaToko || ""} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Alamat</label>
            <Input name="alamat" defaultValue={profile?.alamat || ""} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">No. Telepon</label>
            <Input name="noTelepon" defaultValue={profile?.noTelepon || ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Marketplace Rate (%)</label>
              <Input name="marketplaceRatePct" type="number" defaultValue={profile?.marketplaceRatePct ?? 25} min={0} max={100} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mata Uang</label>
              <select
                name="currency"
                defaultValue={profile?.currency || "IDR"}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full"
              >
                <option value="IDR">IDR (Rupiah)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : <><Save className="size-4 mr-1.5" />Simpan Profil</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/* ─── Backup Tab ─── */

const BACKUP_TYPES: { type: BackupType; label: string; desc: string }[] = [
  { type: "database", label: "Database", desc: "Export Supabase → CSV/SQL ke Google Drive" },
  { type: "invoice_pdf", label: "Invoice PDF", desc: "Backup semua invoice yang pernah di-print" },
  { type: "foto_resi", label: "Foto Resi", desc: "Backup semua foto resi dari Google Drive" },
  { type: "arsip_data", label: "Arsip Data", desc: "Arsip data > 6 bulan ke Google Drive" },
]

function BackupTab() {
  const [backingUp, setBackingUp] = useState<BackupType | null>(null)
  const [history, setHistory] = useState<BackupRecord[]>([])

  useEffect(() => {
    getBackupHistoryAction().then(setHistory).catch(() => {})
  }, [])

  const handleBackup = async (type: BackupType) => {
    setBackingUp(type)
    try {
      await triggerBackupAction(type)
      const updated = await getBackupHistoryAction()
      setHistory(updated)
    } catch {
      alert(`Gagal backup ${type}`)
    } finally {
      setBackingUp(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Backup Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BACKUP_TYPES.map(({ type, label, desc }) => (
              <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBackup(type)}
                  disabled={backingUp === type}
                >
                  {backingUp === type ? (
                    <span className="inline-flex items-center gap-1.5">
                      <RefreshCw className="size-3.5 animate-spin" />
                      Backup...
                    </span>
                  ) : (
                    <><Download className="size-4 mr-1" />Backup</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Backup</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada riwayat backup</p>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={record.status === "success" ? "default" : "destructive"}>
                      {record.status === "success" ? "Sukses" : "Gagal"}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{record.namaFile}</p>
                      <p className="text-xs text-muted-foreground">{record.tipe} · {record.tanggal} · {record.ukuran}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Users Tab ─── */

function UsersTab() {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    getUsersAction().then(setUsers).catch(() => {})
  }, [])

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const newUser = await createUserAction({
        email: formData.get("email") as string,
        nama: formData.get("nama") as string,
        role: formData.get("role") as UserRole,
      })
      if (newUser) {
        setUsers([newUser, ...users])
        setShowForm(false)
        e.currentTarget.reset()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    await updateUserAction(userId, { role })
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u))
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Hapus user ini?")) return
    await deleteUserAction(userId)
    setUsers(users.filter(u => u.id !== userId))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manajemen User</CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4 mr-1" />
          Tambah User
        </Button>
      </CardHeader>
      <CardContent>
        {/* Add User Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input name="nama" placeholder="Nama" required />
              <Input name="email" type="email" placeholder="Email" required />
              <select
                name="role"
                defaultValue="viewer"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Menyimpan..." : "Tambah"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
            </div>
          </form>
        )}

        {/* Users Table */}
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Belum ada user</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{user.nama}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Badge variant={user.aktif ? "default" : "secondary"}>
                    {user.aktif ? "Aktif" : "Nonaktif"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── App Settings Tab ─── */

function AppSettingsTab() {
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      await updateAppSettingsAction({
        defaultMinHari: Number(formData.get("defaultMinHari")),
        theme: formData.get("theme") as "light" | "dark" | "system",
        language: formData.get("language") as "id" | "en",
      })
      alert("Pengaturan berhasil disimpan!")
    } catch {
      alert("Gagal menyimpan pengaturan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Aplikasi</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Min Hari Stok</label>
            <Input name="defaultMinHari" type="number" defaultValue={7} min={1} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tema</label>
            <select
              name="theme"
              defaultValue="system"
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bahasa</label>
            <select
              name="language"
              defaultValue="id"
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full"
            >
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : <><Save className="size-4 mr-1.5" />Simpan Pengaturan</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/* ─── Settings Page ─── */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Kelola profil toko, backup, user, dan pengaturan aplikasi</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil Toko</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="users">User</TabsTrigger>
          <TabsTrigger value="app">Aplikasi</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="backup">
          <BackupTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="app">
          <AppSettingsTab />
        </TabsContent>
      </Tabs>
    </main>
  )
}
