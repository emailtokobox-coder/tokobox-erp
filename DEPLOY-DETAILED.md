# 🚀 DETAILED DEPLOYMENT STEPS — TokoBox ERP ke Vercel

> **Hari ini:** 2026-07-27  
> **Goal:** Aplikasi live di Vercel dengan data aman di Supabase  
> **Estimasi waktu:** ~2-3 jam (termasuk setup awal)  
> **Priority:** RLS Migration = #1 (tanpa ini data terbuka ke publik)

---

## 📋 Overview Urutan Dekat (START HERE)

```
┌─────────────────────────────────────────────────────────┐
│  STEP 0  │  Pre-flight Check                    │ 15 min  │
│  STEP 1  │  Setup Supabase (1x saja)            │ 30 min  │
│  STEP 2  │  Jalankan RLS Migration (KRUSIAL!)   │ 10 min  │
│  STEP 3  │  Upload ke GitHub                    │ 10 min  │
│  STEP 4  │  Link Vercel + Set Env Vars          │ 20 min  │
│  STEP 5  │  Deploy Pertama                       │ 5 min   │
│  STEP 6  │  Smoke Test (VERIFY EVERYTHING)       │ 20 min  │
│  STEP 7  │  RLS Double-Check                     │ 10 min  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔴 STEP 0: Pre-flight Check (15 menit)

### 0.1 Cek File yang Sudah Dibuat

```bash
# Pastikan file berikut ada:
ls tailwind.config.ts       # ✅ shim untuk shadcn
ls .env.example             # ✅ template env vars
ls vercel.json              # ✅ config Vercel
ls supabase/migrations/001_rls_policies.sql  # ✅ RLS policies
ls scripts/migrate.ts       # ✅ migration script
ls DEPLOY.md                # ✅ panduan ini
ls .checkpoint/cert-deploy.md  # ✅ sertifikat iterasi
```

### 0.2 Cek .env.local (SECRET — JANGAN COMMIT!)

```bash
cat .env.local
# Harus ada ini:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> ⚠️ **PENTING:** `.env.local` sudah ada di `.gitignore`. Jangan pernah commit file ini!

### 0.3 Cek Build Lokal

```bash
npx next build
# Expected output:
# ✓ Compiled successfully
# Finished TypeScript in Xs
# No errors
```

Jika ada error → **FIX DULU** sebelum lanjut ke Step 1.

---

## 🟠 STEP 1: Setup Supabase (30 menit)

Ini adalah setup **1x saja**. Jika sudah pernah buat project Supabase, skip ke Step 1.2.

### 1.1 Buat Project Supabase

1. Buka https://supabase.com → Login dengan GitHub
2. Klik **"New Project"**
3. Isi form:
   | Field | Value |
   |-------|-------|
   | **Organization** | Pilih atau buat organization |
   | **Project Name** | `tokobox-erp` |
   | **Database Password** | SIMPAN INI! (butuh untuk akses langsung) |
   | **Region** | Pilih **Southeast Asia (SIN)** — terdekat Indonesia |
   | **Plan** | Free Tier (cukup untuk 1-10 user, 200-500 transaksi/hari) |
4. Klik **"Create new project"**
5. Tunggu ~2 menit sampai project ready

### 1.2 Catat Credentials

Setelah project dibuat, buka **Project Settings** (gear icon di sidebar kiri) → **API**:

```
┌──────────────────────────────────────────────────────────────┐
│  Settings > API                                              │
│                                                              │
│  Project URL:                                                │
│  https://arovjfznstzgqandbahe.supabase.co  ← COPY INI       │
│                                                              │
│  anon / public:                                              │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   ← COPY INI       │
│  (Bisa dibagikan — ini hanya untuk read+write dengan RLS)    │
│                                                              │
│  service_role:                                               │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   ← JANGAN DIBAGI │
│  (SECRET — ini bypass RLS, boleh DROP TABLE!)               │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Isi .env.local

Edit file `.env.local` di root project:

```env
# Ambil dari Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-anda-di-sini>

# Opsional (untuk fitur WhatsApp nanti)
# NEXT_PUBLIC_WA_API_URL=

# Opsional (untuk upload Excel ke Google Drive nanti)
# NEXT_PUBLIC_DRIVE_FOLDER_ID=
```

> **CATATAN:** `.env.local` sudah ada sebelumnya dengan nilai produksi.
> Jika Anda mau pakai project yang sama → gak perlu ubah.
> Jika mau pisah staging/production → buat `.env.production` atau `local`.

---

## 🟡 STEP 2: Setup Database Schema (30 menit)

Sebelum RLS, kita perlu buat tabel-tabelnya dulu.

### 2.1 Buat Tabel-Struktur (Seed SQL)

Buka Supabase Dashboard → **SQL Editor** → Paste SQL berikut → Klik **"Run"**:

```sql
-- =========================================================
-- TokoBox ERP — Database Schema (21 Tabel)
-- Berdasarkan PRD Section 5
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- 5.1 Tabel: stores ( setiap user punya 1 store)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'shopee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name, platform);

-- ---------------------------------------------------------
-- 5.2 Tabel: orderHeaders
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS orderHeaders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  no_pesanan TEXT NOT NULL,
  status_pesanan TEXT NOT NULL,
  waktu_pesanan_dibuat TEXT NOT NULL,
  waktu_pembayaran TEXT DEFAULT '',
  metode_pembayaran TEXT DEFAULT '',
  username_pembeli TEXT DEFAULT '',
  ekspedisi TEXT DEFAULT '',
  kota TEXT DEFAULT '',
  total_qty_order INTEGER NOT NULL DEFAULT 0,
  total_qty_return INTEGER NOT NULL DEFAULT 0,
  total_qty_valid INTEGER NOT NULL DEFAULT 0,
  total_omzet_valid NUMERIC NOT NULL DEFAULT 0,
  total_omzet_retur NUMERIC NOT NULL DEFAULT 0,
  total_hpp_valid NUMERIC NOT NULL DEFAULT 0,
  total_hpp_retur NUMERIC NOT NULL DEFAULT 0,
  status_order_final TEXT NOT NULL,
  income_aktual NUMERIC,
  status_income TEXT NOT NULL DEFAULT 'Belum Ada Income',
  total_penyesuaian NUMERIC NOT NULL DEFAULT 0,
  profit_sebelum_penyesuaian NUMERIC NOT NULL DEFAULT 0,
  profit_setelah_penyesuaian NUMERIC NOT NULL DEFAULT 0,
  status_profit TEXT NOT NULL DEFAULT 'Belum Ada Income',
  status_hpp TEXT NOT NULL DEFAULT 'HPP Kosong',
  item_count INTEGER NOT NULL DEFAULT 0,
  import_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orderHeaders_store ON orderHeaders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orderHeaders_status ON orderHeaders(store_id, status_order_final);

-- Unique constraint bolt (store_id + no_pesanan)
CREATE UNIQUE INDEX IF NOT EXISTS uq_orderHeaders_store_no ON orderHeaders(store_id, no_pesanan);

-- ---------------------------------------------------------
-- 5.3 Tabel: orderItems
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS orderItems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  no_pesanan TEXT NOT NULL,
  status_pesanan TEXT NOT NULL,
  waktu_pesanan_dibuat TEXT NOT NULL DEFAULT '',
  ekspedisi TEXT DEFAULT '',
  kota TEXT DEFAULT '',
  sku TEXT NOT NULL,
  sku_normalized TEXT NOT NULL,
  nama_produk TEXT NOT NULL,
  nama_variasi TEXT DEFAULT '',
  harga_awal NUMERIC NOT NULL DEFAULT 0,
  harga_setelah_diskon NUMERIC NOT NULL DEFAULT 0,
  qty_order INTEGER NOT NULL DEFAULT 0,
  qty_return INTEGER NOT NULL DEFAULT 0,
  qty_valid INTEGER NOT NULL DEFAULT 0,
  nilai_item_total NUMERIC NOT NULL DEFAULT 0,
  harga_per_qty NUMERIC NOT NULL DEFAULT 0,
  omzet_valid NUMERIC NOT NULL DEFAULT 0,
  omzet_retur NUMERIC NOT NULL DEFAULT 0,
  hpp_per_sku NUMERIC,
  hpp_valid NUMERIC NOT NULL DEFAULT 0,
  hpp_retur NUMERIC NOT NULL DEFAULT 0,
  status_item TEXT NOT NULL DEFAULT 'NORMAL',
  item_hash TEXT NOT NULL,
  import_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orderItems_store ON orderItems(store_id);
CREATE INDEX IF NOT EXISTS idx_orderItems_no ON orderItems(store_id, no_pesanan);
CREATE INDEX IF NOT EXISTS idx_orderItems_sku ON orderItems(store_id, sku_normalized);
CREATE INDEX IF NOT EXISTS idx_orderItems_hash ON orderItems(item_hash);

-- ---------------------------------------------------------
-- 5.4 Tabel: incomes
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  no_pesanan TEXT NOT NULL,
  username_pembeli TEXT DEFAULT '',
  waktu_pesanan_dibuat TEXT DEFAULT '',
  metode_pembayaran TEXT DEFAULT '',
  tanggal_dana_dilepaskan TEXT DEFAULT '',
  harga_asli_produk NUMERIC NOT NULL DEFAULT 0,
  total_diskon_produk NUMERIC NOT NULL DEFAULT 0,
  pengembalian_dana NUMERIC NOT NULL DEFAULT 0,
  diskon_dari_shopee NUMERIC NOT NULL DEFAULT 0,
  voucher_penjual NUMERIC NOT NULL DEFAULT 0,
  ongkir_dibayar_pembeli NUMERIC NOT NULL DEFAULT 0,
  gratis_ongkir_shopee NUMERIC NOT NULL DEFAULT 0,
  biaya_komisi_ams NUMERIC NOT NULL DEFAULT 0,
  biaya_administrasi NUMERIC NOT NULL DEFAULT 0,
  biaya_layanan NUMERIC NOT NULL DEFAULT 0,
  biaya_proses_pesanan NUMERIC NOT NULL DEFAULT 0,
  total_penghasilan NUMERIC NOT NULL DEFAULT 0,
  import_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incomes_store ON incomes(store_id, no_pesanan);
CREATE UNIQUE INDEX IF NOT EXISTS uq_incomes_store_no ON incomes(store_id, no_pesanan);

-- ---------------------------------------------------------
-- 5.5 Tabel: adjustments
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  no_pesanan_terhubung TEXT NOT NULL,
  tanggal_adjustment TEXT NOT NULL,
  tipe_adjustment TEXT NOT NULL,
  biaya_penyesuaian NUMERIC NOT NULL DEFAULT 0,
  import_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adjustments_store ON adjustments(store_id, no_pesanan_terhubung);

-- ---------------------------------------------------------
-- 5.6 Tabel: hppSkus
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS hppSkus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  sku TEXT NOT NULL,
  sku_normalized TEXT NOT NULL,
  hpp NUMERIC NOT NULL DEFAULT 0,
  nama_produk TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hppSkus_store ON hppSkus(store_id, sku_normalized);
CREATE UNIQUE INDEX IF NOT EXISTS uq_hppSkus_store_sku ON hppSkus(store_id, sku_normalized);

-- ---------------------------------------------------------
-- 5.7 Tabel: grosirHarga
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS grosirHarga (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  sku TEXT NOT NULL,
  sku_normalized TEXT NOT NULL,
  base_harga NUMERIC NOT NULL DEFAULT 0,
  min_qty INTEGER NOT NULL DEFAULT 1,
  harga_grosir NUMERIC NOT NULL DEFAULT 0,
  mulai_berlaku TEXT NOT NULL,
  berlaku_sampai TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grosirHarga_store ON grosirHarga(store_id, sku_normalized, mulai_berlaku);

-- ---------------------------------------------------------
-- 5.8 Tabel: stockMovements
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS stockMovements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  base_product TEXT NOT NULL,
  tipe TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  no_ref TEXT DEFAULT '',
  qty_base_unit INTEGER NOT NULL,
  source TEXT NOT NULL,
  supplier TEXT DEFAULT '',
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stockMovements_store ON stockMovements(store_id, base_product, tanggal);

-- ---------------------------------------------------------
-- 5.9 Tabel: stockAlerts
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS stockAlerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  base_product TEXT NOT NULL,
  tipe TEXT NOT NULL,
  ambang_bawah INTEGER NOT NULL DEFAULT 0,
  stok_saat_ini INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stockAlerts_store ON stockAlerts(store_id, base_product, status);

-- ---------------------------------------------------------
-- 5.10 Tabel: stockOpname
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS stockOpname (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  base_product TEXT NOT NULL,
  tanggal_opname TEXT NOT NULL,
  stok_sistem INTEGER NOT NULL DEFAULT 0,
  stok_fisik INTEGER NOT NULL DEFAULT 0,
  selisih INTEGER NOT NULL DEFAULT 0,
  keterangan TEXT DEFAULT '',
  user_input TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stockOpname_store ON stockOpname(store_id, base_product, tanggal_opname);

-- ---------------------------------------------------------
-- 5.11 Tabel: stockSaldo
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS stockSaldo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  base_product TEXT NOT NULL,
  stok_akhir INTEGER NOT NULL DEFAULT 0,
  last_movement_date TEXT,
  last_movement_type TEXT,
  reconcile_status TEXT NOT NULL DEFAULT 'BELUM',
  keterangan TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stockSaldo_store ON stockSaldo(store_id, base_product);
CREATE UNIQUE INDEX IF NOT EXISTS uq_stockSaldo_store_prod ON stockSaldo(store_id, base_product);

-- ---------------------------------------------------------
-- 5.12 Tabel: settings
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  key TEXT NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_settings_store_key ON settings(store_id, key);

-- ---------------------------------------------------------
-- 5.13 Tabel: suppliers
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  nama TEXT NOT NULL,
  kontak TEXT DEFAULT '',
  alamat TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_store ON suppliers(store_id, nama);

-- ---------------------------------------------------------
-- 5.14 Tabel: supplierPrices
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplierPrices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  base_product TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  harga NUMERIC NOT NULL DEFAULT 0,
  satuan TEXT DEFAULT 'pcs',
  berlaku_mulai TEXT NOT NULL,
  berlaku_sampai TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplierPrices_store ON supplierPrices(store_id, base_product, supplier_id);

-- ---------------------------------------------------------
-- 5.15 Tabel: manualOrders
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS manualOrders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  no_pesanan TEXT NOT NULL,
  status_pesanan TEXT NOT NULL DEFAULT 'Menunggu Pembayaran',
  nama_pembeli TEXT DEFAULT '',
  kontak_pembeli TEXT DEFAULT '',
  tanggal_order TEXT NOT NULL,
  total_qty INTEGER NOT NULL DEFAULT 0,
  total_omzet NUMERIC NOT NULL DEFAULT 0,
  total_hpp NUMERIC NOT NULL DEFAULT 0,
  status_order TEXT NOT NULL DEFAULT 'AKTIF',
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manualOrders_store ON manualOrders(store_id, tanggal_order);

-- ---------------------------------------------------------
-- 5.16 Tabel: dpPayments
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS dpPayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  manual_order_id UUID NOT NULL REFERENCES manualOrders(id),
  nominal_dp NUMERIC NOT NULL DEFAULT 0,
  tanggal_dp TEXT NOT NULL,
  metode_pembayaran TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'TERKONFIRMASI',
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dpPayments_store ON dpPayments(store_id, manual_order_id);

-- ---------------------------------------------------------
-- 5.17 Tabel: terminPayments
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS terminPayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  manual_order_id UUID NOT NULL REFERENCES manualOrders(id),
  nominal_termin NUMERIC NOT NULL DEFAULT 0,
  jatuh_tempo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'BELUM_BAYAR',
  tanggal_bayar TEXT DEFAULT '',
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terminPayments_store ON terminPayments(store_id, manual_order_id);

-- ---------------------------------------------------------
-- 5.18 Tabel: resiData
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS resiData (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  no_resi TEXT NOT NULL,
  ekspedisi TEXT NOT NULL,
  no_pesanan TEXT DEFAULT '',
  nama_penerima TEXT DEFAULT '',
  alamat TEXT DEFAULT '',
  kota TEXT DEFAULT '',
  berat_barang TEXT DEFAULT '',
  biaya_ongkir NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DALAM_PENGIRIMAN',
  url_resi TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resiData_store ON resiData(store_id, no_resi);

-- ---------------------------------------------------------
-- 5.19 Tabel: whatsappLogs
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS whatsappLogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  no_pesanan TEXT DEFAULT '',
  tipe TEXT NOT NULL,
  nomor_tujuan TEXT NOT NULL,
  pesan TEXT NOT NULL,
  payload_json TEXT DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING',
  error_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsappLogs_store ON whatsappLogs(store_id, no_pesanan);

-- ---------------------------------------------------------
-- 5.20 Tabel: invoices
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  no_invoice TEXT NOT NULL,
  no_pesanan TEXT DEFAULT '',
  tanggal_invoice TEXT NOT NULL,
  nama_pembeli TEXT DEFAULT '',
  total_tagihan NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  url_file TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_store ON invoices(store_id, no_invoice);

-- ---------------------------------------------------------
-- 5.21 Tabel: importLogs
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS importLogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  tipe_import TEXT NOT NULL,
  nama_file TEXT NOT NULL,
  jumlah_baris INTEGER NOT NULL DEFAULT 0,
  jumlah_insert INTEGER NOT NULL DEFAULT 0,
  jumlah_update INTEGER NOT NULL DEFAULT 0,
  jumlah_error INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PROCESSING',
  pesan_error TEXT DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_importLogs_store ON importLogs(store_id, started_at DESC);

-- Verifikasi jumlah tabel
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected output:** 21 tabel (`adjustments`, `dpPayments`, `grosirHarga`, `hppSkus`, `importLogs`, `incomes`, `invoices`, `manualOrders`, `orderHeaders`, `orderItems`, `resiData`, `settings`, `stockAlerts`, `stockMovements`, `stockOpname`, `stockSaldo`, `stockMovements`, `suppliers`, `supplierPrices`, `terminPayments`, `whatsappLogs`)

---

## 🔴 STEP 2: RLS Migration — KRUSIAL! (10 menit)

> ⚠️ **STATUS: WAJIB!!!**
> Tanpa RLS, semua data di Supabase bisa diakses publik.
> Orang lain bisa baca/edit/delete data toko Anda.
> **Ini bukan opsional.**

### 2.1 Buka SQL Editor

1. Di Supabase Dashboard, klik **SQL Editor** (icon terminal di sidebar kiri)
2. Klik **"New Query"** (jangan pakai saved migration, jalankan manual dulu)

### 2.2 Paste RLS SQL

Buka file ini di komputer Anda:
```
supabase/migrations/001_rls_policies.sql
```

Copy SEMUA isinya, lalu paste ke SQL Editor Supabase → Klik **"RUN"**.

> **Expected output:** 60+ baris sukses (22 tabel × ~3 policy + store khusus)

```
✅ ALTER TABLE... ENABLE ROW LEVEL SECURITY (22 kali)
✅ CREATE POLICY... (60+ policies)
✅ Done!
```

### 2.3 Verifikasi RLS Aktif

Jalankan query ini di SQL Editor untuk cek apakah RLS sudah aktif:

```sql
-- Cek tabel yang sudah aktif RLS
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'stores', 'orderheaders', 'orderitems', 'incomes', 'adjustments',
    'hppskus', 'grosirharga', 'stockmovements', 'stockalerts',
    'stockopname', 'stocksaldo', 'settings', 'suppliers',
    'supplierprices', 'manualorders', 'dppayments',
    'terminpayments', 'residata', 'whatsapplogs', 'invoices', 'importlogs'
  )
ORDER BY tablename;
```

**Harus return `true` untuk SEMUA tabel!**

### 2.4 Verifikasi Policies Terbuat

```sql
-- Cek jumlah policies per tabel
SELECT
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected:** Setiap tabel punya ±3 policies (1 untuk ALL, 1 untuk INSERT, 1 untuk UPDATE).

### 2.5 Verifikasi RLS Benar-benur Blokir

**Uji kritis — WAJIB dilakukan!**

1. Di Supabase Dashboard → **Table Editor** → pilih tabel `orderHeaders`
2. Klik **"Insert row"** → isi data dummy:
   | Kolom | Nilai |
   |-------|-------|
   | store_id | `00000000-0000-0000-0000-000000000000` (UUID palsu) |
   | no_pesanan | `TEST-RLS-BLOCK-001` |
   | status_pesanan | `Batal` |
   | waktu_pesanan_dibuat | `2024-01-01 00:00:00` |
   | status_order_final | `Batal` |
3. Klik **"Save"**

**Expected:** Supabase akan **BLOCK** insert dengan error:
```
new row violates row-level security policy for table "orderHeaders"
```

✅ Jika error muncul = **RLS bekerja dengan benar!**

4. Hapus row insernya, lalu lanjut Step 3.

---

## 🟢 STEP 3: Upload ke GitHub (10 menit)

### 3.1 Inisialisasi Git (jika belum)

```bash
cd C:\Users\USER\ZCodeProject\tokobox-erp

git init
git add .
git commit -m "feat: Phase 9 Deploy Prep — RLS, vercel.json, .env.example, build verified"
```

### 3.2 Buat Repo di GitHub

1. Buka https://github.com/new
2. Isi:
   | Field | Value |
   |-------|-------|
   | Repository name | `tokobox-erp` |
   | Description | `TokoBox Shopee ERP — Internal Cloud ERP` |
   | Visibility | **Private** (karena ada business logic) |
   | Don't initialize | ✅ Centang (sudah ada README & git lokal) |
3. Klik **"Create repository"**

### 3.3 Push ke GitHub

```bash
git remote add origin https://github.com/<username-kamu>/tokobox-erp.git
git branch -M main
git push -u origin main
```

**Expected:**
```
Enumerating objects: 200, done.
Counting objects: 100% (200/200), done.
Writing objects: 100% (200/200), 123.45 KiB | 3.21 MiB/s, done.
To https://github.com/xxx/tokobox-erp.git
 * [new branch]      main -> main
```

---

## 🔵 STEP 4: Link Vercel + Set Env Vars (20 menit)

### 4.1 Import Project ke Vercel

1. Buka https://vercel.com/new
2. Klik **"Import"** → Pilih repository `tokobox-erp`
3. **Framework Preset:** Next.js (otomatis terdeteksi)
4. **Root Directory:** `tokobox-erp/`
5. **Build Command:** `next build` (default)
6. Klik **"Deploy"** (jangan dulu — lanjut set env vars dulu)

### 4.2 Set Environment Variables

Di halaman import, klik **"Environment Variables"** tab dan tambahkan:

| Name | Value | Environment | Notes |
|------|-------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://arovjfznstzgqandbahe.supabase.co` | Production, Preview, Development | Dari Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Production, Preview, Development | Dari Supabase Dashboard |

> **Penting:**
> - `NEXT_PUBLIC_` prefix = bisa di-read di browser (client-side). **Ini SESUAI** karena ini public key Supabase.
> - JANGAN set `SUPABASE_SERVICE_ROLE_KEY` sebagai env var di Vercel (kecuali Anda butuh trigger migration dari Vercel). Key ini biasanya untuk admin scripts saja.

### 4.3 Deploy

Klik **"Deploy"** → Tunggu ~3 menit.

**Build Expected:**
- ✅ Build berhasil (Pastikan dari Step 0.3)
- ✅ Output URL: `https://tokobox-erp-xxx.vercel.app`
- ✅ Klik URL untuk verify

---

## 🟣 STEP 5: Verifikasi Deployment (20 menit)

### 5.1 Cek Basic Load

Buka URL Vercel Anda:
```
https://tokobox-erp-xxx.vercel.app
```

**Expected:**
- Menampilkan halaman **Landing/Login** (bukan error)
- Inspect browser console → **NO red errors**

### 5.2 Cek Build Log (jika gagal)

Jika deploy gagal:
1. Klik project di Vercel Dashboard
2. Tab **"Deployments"** → Klik deployment yang gagal
3. Baca log error
4. Umumnya: env var salah / build error

### 5.3 Smoke Test — Checklist

| Test | Cara | Expected |
|------|------|----------|
| **Landing page loads** | Buka root URL | Halaman login/register muncul |
| **No console errors** | F12 → Console | Tidak ada error merah |
| **Login form renders** | `/login` | Form email+password + button submit |
| **Supabase connection works** | Coba login (tapi jangan submit dulu) | Tidak ada network error 404 |
| **CSS loads correctly** | Inspect elemen | Tailwind classes aktif, bukan unstyled |

---

## 🔒 STEP 6: RLS Double-Check (10 menit)

Setelah deploy berhasil, pastikan RLS masih aktif di production database:

### 6.1 Cek dari Supabase Dashboard

1. Buka Supabase → **SQL Editor**
2. Jalankan query dari Step 2.3 (cek RLS aktif) + Step 2.4 (cek policies)
3. Pastikan `rowsecurity = true` untuk SEMUA tabel

### 6.2 Test RLS via Supabase Dashboard

1. **Table Editor** → `orderHeaders`
2. Klik **"Insert row"** → isi data dummy (lihat Step 2.5)
3. **Expected:** Supabase BLOCK insert dengan RLS error
4. Hapus row test, lanjut normal usage

### 6.3 Test RLS via Aplikasi

1. Register akun baru di aplikasi live
2. Login
3. Import file Excel (jika sudah ada fitur)
4. Cek Table Editor → `orderHeaders`
5. **Expected:** Hanya ada baris dengan `store_id` milik user yang login

---

## 📦 File Structure Akhir

```
tokobox-erp/
├── tailwind.config.ts          ✅ Shim shadcn/ui
├── .env.example                ✅ Template env vars
├── vercel.json                 ✅ Config Vercel
├── DEPLOY.md                   ✅ Panduan singkat
├── DEPLOY-DETAILED.md          ✅ Panduan detail ini
├── supabase/
│   └── migrations/
│       └── 001_rls_policies.sql ✅ RLS policies (60+ policies)
├── scripts/
│   └── migrate.ts              ✅ CLI migration runner
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/              ✅ Login page (Iter 48)
│   │   ├── register/           ✅ Register page (Iter 48)
│   │   ├── dashboard/          ✅ Protected dashboard
│   │   └── ...
│   ├── features/
│   │   ├── orders/             ✅ Order features (Iter 39-46)
│   │   ├── finance/            ✅ Finance (Iter 47-48)
│   │   ├── inventory/          ✅ Inventory
│   │   ├── upload/             ✅ Upload Excel
│   │   └── ...
│   └── lib/
│       └── supabase/
│           └── client.ts       ✅ Supabase client
└── .checkpoint/
    ├── state.json              ✅ Updated
    └── cert-deploy.md          ✅ Phase 9 certificate
```

---

## 🆘 Troubleshooting

### Build Gagal di Vercel

```
Error: Module not found: Can't resolve 'xlsx'
```
**Fix:** `npm install xlsx` secara lokal, commit `package-lock.json`, push lagi.

```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```
**Fix:** Cek Environment Variables di Vercel Settings. Pastikan nama variabel SAMA PERSIS (case-sensitive).

### RLS Tidak Aktif

```
ERROR: new row violates row-level security policy
```
**Ini BUKAN error!** = RLS bekerja dengan benar ✅  
Jika Anda lihat ini saat testing, berarti RLS sudah aktif.

Jika RLS TIDAK aktif (bisa insert sembarang data):
1. Cek `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sudah dijalankan
2. Cek policy sudah dibuat: `SELECT * FROM pg_policies WHERE tablename = 'nama_tabel'`
3. Jika belum ada, jalankan ulang SQL migrasi di Step 2.2

### Koneksi Supabase Error

```
Failed to fetch / API Error: Invalid API key
```
**Fix:** Pastikan `NEXT_PUBLIC_SUPABASE_ANON_KEY` benar. Cek di Supabase Dashboard → Settings → API.

---

## 🎉 Setelah Deploy Berhasil

```
┌─────────────────────────────────────────────────────┐
│ ✅ Phase 9 SELESAI                                    │
│                                                      │
│ Aplikasi live di: https://tokobox-erp.vercel.app     │
│ Database aman dengan RLS                             │
│ Build verified: npx next build lulus bersih           │
│                                                      │
│ Next: Phase 10 — Buat feature baru / testing         │
└─────────────────────────────────────────────────────┘
```

Selamat! TokoBox ERP sekarang live di Vercel 🚀
