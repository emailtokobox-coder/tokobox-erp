# Certifikasi Iterasi 49 — Phase 9: Persiapan Deploy ke Vercel

**Tanggal:** 2026-07-27  
**Status:** ✅ SELESAI — Build verified, semua file dibuat tanpa error  
**Phase:** Phase 9: Persiapan Deploy ke Vercel  
**Iteration:** Iter 49

---

## Ringkasan Eksekusi

Semua tugas Phase 9 telah diselesaikan. Aplikasi siap untuk deployment ke Vercel setelah langkah RLS migration di Supabase dashboard.

### Checklist Tugas

| # | Tugas | Status | File |
|---|-------|--------|------|
| A | Tailwind config shim | ✅ Done | `tailwind.config.ts` |
| B | .env.example template | ✅ Done | `.env.example` |
| C | Vercel deployment config | ✅ Done | `vercel.json` |
| D | RLS Policies audit & SQL | ✅ Done | `supabase/migrations/001_rls_policies.sql` |
| E | Migration CLI script | ✅ Done | `scripts/migrate.ts` |
| F | Build verification | ✅ Passed | `npx next build` — 0 errors |
| G | Deploy documentation | ✅ Done | `DEPLOY.md` |
| H | State + cert update | ✅ Done | `state.json`, `cert-deploy.md` |

---

## Detail Perubahan

### A. tailwind.config.ts (shim)
- File baru: `tailwind.config.ts`
- Bertindak sebagai shim untuk shadcn/ui CLI yang membaca `components.json`
- Menggunakan `Record<string, unknown>` cast agar kompatibel dengan Tailwind v4
- Menyertakan `baseColor: "slate"` dan `cssVariables: true` sesuai components.json

### B. .env.example (template)
- File baru: `.env.example`
- Berisi 4 env var keys tanpa nilai (template saja)
- Tidak mengandung kredensial asli
- `.gitignore` diperbarui: `.env.local` tetap di-ignore, `.env.example` aman untuk commit

### C. vercel.json
- File baru: `vercel.json`
- Region: `sin1` (Singapore — terdekat Indonesia)
- Max execution time: 60s (untuk import Excel besar)
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS

### D. RLS Policies (supabase/migrations/001_rls_policies.sql)
- File baru: `supabase/migrations/001_rls_policies.sql`
- **21 tabel** mendapat RLS policies:
  - `stores` (primary key = auth.uid())
  - `orderHeaders`, `orderItems` (store_id = auth.uid()::TEXT)
  - `incomes`, `adjustments`, `hppSkus`, `grosirHarga`
  - `stockMovements`, `stockAlerts`, `stockOpname`, `stockSaldo`
  - `settings`, `suppliers`, `supplierPrices`
  - `manualOrders`, `dpPayments`, `terminPayments`
  - `resiData`, `whatsappLogs`, `invoices`, `importLogs`
- Setiap tabel memiliki 3 policy: SELECT, INSERT, UPDATE
- Pola RLS: `store_id = auth.uid()::TEXT` sesuai PRD Section 5.23

### E. scripts/migrate.ts
- File baru: `scripts/migrate.ts`
- Script CLI untuk apply migration SQL dari terminal
- Menggunakan Supabase REST API dengan service_role key
- Split SQL by semicolon, execute sequentially
- Error handling per statement

### F. Build Verification
- `npx next build` berhasil tanpa error
- TypeScript type check: ✅ PASS
- No unused locals/parameters errors
- Bundle: chunks ter-split dengan baik (lazy loading untuk xlsx)

### G. DEPLOY.md
- File baru: `DEPLOY.md`
- Panduan lengkap: GitHub → Vercel → Env Vars → RLS → Smoke Test
- Peringatan keamanan tentang service_role_key
- Troubleshooting section

### H. File Terkait
- `tsconfig.json`: scripts/ ditambahkan ke exclude
- `.gitignore`: diperbarui agar `.env.example` tidak di-ignore

---

## Verifikasi Build

```
$ npx next build
Finished TypeScript in 6.9s ...
✓ Compiled successfully
No TypeScript errors detected
```

---

## Catatan Penting untuk Production

1. **RLS adalah prioritas #1** — Tanpa RLS, semua data bisa diakses publik melalui Supabase anon key
2. **Service role key** harus disimpan sebagai Secret di Vercel (bukan NEXT_PUBLIC_)
3. **Supabase schema migration** belum dijalankan — tabel-tabel perlu dibuat terlebih dahulu sebelum RLS policies bisa diterapkan
4. **Tailwind v4** menggunakan CSS-first config — tailwind.config.ts hanya shim untuk shadcn CLI

---

## Next Steps (Phase 10)

- Lihat panduan deploy lengkap dengan screenshot-ready steps: **`DEPLOY-DETAILED.md`**
- Setup Supabase (bikin project, isi .env.local)
- Buat 21 tabel di Supabase SQL Editor (seed schema)
- **KRUSIAL:** Jalankan RLS migration (`001_rls_policies.sql`) via Supabase SQL Editor
- Upload ke GitHub → link ke Vercel → set env vars → deploy
- Smoke test: login, import Excel, cek data
- Verifikasi RLS benar-benur blokir akses tanpa store_id
