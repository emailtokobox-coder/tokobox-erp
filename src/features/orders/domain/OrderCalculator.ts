/**
 * @module orders/domain
 * OrderCalculator — pure calculation functions for orders.
 *
 * Ported from shopee-erp/src/data/engine/processor.ts
 */

import type { OrderItem, OrderHeader, IncomeRecord, AdjustmentRecord, HppSku, HppIssue, DashboardSummary } from "../types/OrderItem"

// ─── Item Calculation ───

export function calculateItem(
  noPesanan: string,
  sku: string,
  namaProduk: string,
  namaVariasi: string,
  hargaAsli: number,
  hargaSetelahDiskon: number,
  qtyOrder: number,
  qtyReturn: number,
  subtotalPesanan: number,
  statusPesanan: string,
  hppPerSku: number | null,
): OrderItem {
  const effectiveQtyReturn = qtyReturn > qtyOrder ? qtyOrder : qtyReturn
  const qtyValid = qtyOrder - effectiveQtyReturn
  const hargaPerQty = qtyOrder > 0 ? subtotalPesanan / qtyOrder : 0

  let statusItem: OrderItem["statusItem"]
  let omzetValid: number
  let hppValid: number

  if (statusPesanan === "Batal") {
    statusItem = "BATAL"
    omzetValid = 0
    hppValid = 0
  } else {
    omzetValid = hargaPerQty * qtyValid
    hppValid = hppPerSku != null ? hppPerSku * qtyValid : 0

    if (effectiveQtyReturn === 0) {
      statusItem = "NORMAL"
    } else if (qtyValid > 0) {
      statusItem = "PARTIAL_RETURN"
    } else {
      statusItem = "FULL_RETURN"
    }
  }

  const omzetRetur = hargaPerQty * effectiveQtyReturn
  const hppRetur = hppPerSku != null ? hppPerSku * effectiveQtyReturn : 0

  return {
    storeId: "",
    noPesanan,
    statusPesanan,
    waktuPesananDibuat: "",
    sku,
    skuNormalized: sku.toLowerCase().trim(),
    namaProduk,
    namaVariasi,
    hargaAwal: hargaAsli,
    hargaSetelahDiskon,
    qtyOrder,
    qtyReturn: effectiveQtyReturn,
    qtyValid,
    nilaiItemTotal: subtotalPesanan,
    hargaPerQty,
    omzetValid,
    omzetRetur,
    hppPerSku,
    hppValid,
    hppRetur,
    statusItem,
    itemHash: "",
    importDate: new Date().toISOString(),
  }
}

// ─── Build Order Headers ───

export function buildOrderHeaders(items: OrderItem[], storeId: string): OrderHeader[] {
  const map = new Map<string, OrderItem[]>()

  for (const item of items) {
    const group = map.get(item.noPesanan)
    if (group) {
      group.push(item)
    } else {
      map.set(item.noPesanan, [item])
    }
  }

  const headers: OrderHeader[] = []

  for (const [noPesanan, groupItems] of map) {
    const first = groupItems[0]

    let totalQtyOrder = 0
    let totalQtyReturn = 0
    let totalQtyValid = 0
    let totalOmzetValid = 0
    let totalOmzetRetur = 0
    let totalHppValid = 0
    let totalHppRetur = 0

    for (const item of groupItems) {
      totalQtyOrder += item.qtyOrder
      totalQtyReturn += item.qtyReturn
      totalQtyValid += item.qtyValid
      totalOmzetValid += item.omzetValid
      totalOmzetRetur += item.omzetRetur
      totalHppValid += item.hppValid
      totalHppRetur += item.hppRetur
    }

    let statusOrderFinal: OrderHeader["statusOrderFinal"]
    let isBatal = false

    if (first.statusPesanan === "Batal") {
      statusOrderFinal = "Batal"
      isBatal = true
      totalOmzetValid = 0
      totalHppValid = 0
    } else if (totalQtyReturn === 0 && totalQtyValid > 0) {
      statusOrderFinal = "Selesai / Normal"
    } else if (totalQtyReturn > 0 && totalQtyValid > 0) {
      statusOrderFinal = "Retur Sebagian"
    } else if (totalQtyReturn > 0 && totalQtyValid === 0) {
      statusOrderFinal = "Retur Full"
    } else {
      statusOrderFinal = "Selesai / Normal"
    }

    let statusHpp: OrderHeader["statusHpp"]
    if (isBatal) {
      statusHpp = "Tidak Perlu HPP / Batal"
    } else {
      const validItems = groupItems.filter((i) => i.statusItem !== "BATAL" && i.qtyValid > 0)
      if (validItems.length === 0) {
        statusHpp = "Tidak Perlu HPP / Batal"
      } else {
        const withHpp = validItems.filter((i) => i.hppPerSku != null && i.hppPerSku > 0)
        if (withHpp.length === validItems.length) {
          statusHpp = "HPP Lengkap"
        } else if (withHpp.length > 0) {
          statusHpp = "HPP Sebagian"
        } else {
          statusHpp = "HPP Kosong"
        }
      }
    }

    const statusIncome: OrderHeader["statusIncome"] = isBatal ? "Tidak Perlu Income" : "Belum Ada Income"
    const statusProfit: OrderHeader["statusProfit"] = isBatal ? "Tidak Dihitung" : "Belum Ada Income"

    headers.push({
      storeId,
      noPesanan,
      statusPesanan: first.statusPesanan,
      waktuPesananDibuat: first.waktuPesananDibuat,
      waktuPembayaran: "",
      metodePembayaran: "",
      usernamePembeli: "",
      ekspedisi: first.ekspedisi,
      kota: first.kota,
      totalQtyOrder,
      totalQtyReturn,
      totalQtyValid,
      totalOmzetValid,
      totalOmzetRetur,
      totalHppValid,
      totalHppRetur,
      statusOrderFinal,
      incomeAktual: null,
      statusIncome,
      totalPenyesuaian: 0,
      profitSebelumPenyesuaian: 0,
      profitSetelahPenyesuaian: 0,
      statusProfit,
      statusHpp,
      itemCount: groupItems.length,
      importDate: new Date().toISOString(),
    })
  }

  return headers
}

// ─── Match Income ───

export function matchIncome(
  headers: OrderHeader[],
  incomes: IncomeRecord[],
): OrderHeader[] {
  const incomeMap = new Map<string, IncomeRecord>()
  for (const inc of incomes) {
    const key = `${inc.storeId}|${inc.noPesanan}`
    incomeMap.set(key, inc)
  }

  return headers.map((header) => {
    const key = `${header.storeId}|${header.noPesanan}`
    const income = incomeMap.get(key)

    if (income) {
      const incomeAktual = income.totalPenghasilan
      const profitSebelumPenyesuaian = incomeAktual - header.totalHppValid
      const profitSetelahPenyesuaian = incomeAktual + header.totalPenyesuaian - header.totalHppValid

      return {
        ...header,
        incomeAktual,
        statusIncome: "Sudah Cocok" as const,
        profitSebelumPenyesuaian,
        profitSetelahPenyesuaian,
        statusProfit: "Sudah Dihitung" as const,
        waktuPembayaran: header.waktuPembayaran || income.tanggalDanaDilepaskan,
        metodePembayaran: header.metodePembayaran || income.metodePembayaran,
        usernamePembeli: header.usernamePembeli || income.usernamePembeli,
      }
    }

    return header
  })
}

// ─── Match Adjustment ───

export function matchAdjustment(
  headers: OrderHeader[],
  adjustments: AdjustmentRecord[],
): OrderHeader[] {
  const adjMap = new Map<string, number>()
  for (const adj of adjustments) {
    const existing = adjMap.get(adj.noPesananTerhubung) ?? 0
    adjMap.set(adj.noPesananTerhubung, existing + adj.biayaPenyesuaian)
  }

  return headers.map((header) => {
    if (header.statusPesanan === "Batal") {
      return header
    }

    const totalPenyesuaian = adjMap.get(header.noPesanan) ?? 0
    const incomeAktual = header.incomeAktual ?? 0
    const profitSebelumPenyesuaian = incomeAktual - header.totalHppValid
    const profitSetelahPenyesuaian = incomeAktual + totalPenyesuaian - header.totalHppValid

    return {
      ...header,
      totalPenyesuaian,
      profitSebelumPenyesuaian,
      profitSetelahPenyesuaian,
    }
  })
}

// ─── Apply HPP ───

export function applyHppToItems(items: OrderItem[], hppMap: Map<string, HppSku>): OrderItem[] {
  return items.map((item) => {
    const key = item.sku.toLowerCase().trim()
    const hppSku = hppMap.get(key)

    if (hppSku) {
      const hppPerSku = hppSku.hpp
      const omzetValid = item.statusItem === "BATAL" ? 0 : item.hargaPerQty * item.qtyValid
      const hppValid = hppPerSku * item.qtyValid
      const omzetRetur = item.hargaPerQty * item.qtyReturn
      const hppRetur = hppPerSku * item.qtyReturn

      return {
        ...item,
        hppPerSku,
        omzetValid,
        hppValid,
        omzetRetur,
        hppRetur,
      }
    }

    return item
  })
}

// ─── HPP Resolver ───

export function buildHppResolver(items: OrderItem[]): HppIssue[] {
  const skuMap = new Map<string, {
    sku: string
    skuNormalized: string
    namaProduk: string
    orders: Set<string>
    qtyValid: number
    omzet: number
  }>()

  for (const item of items) {
    if (item.hppPerSku != null || item.qtyValid <= 0 || item.statusItem === "BATAL") continue

    const key = item.skuNormalized
    let entry = skuMap.get(key)
    if (!entry) {
      entry = {
        sku: item.sku,
        skuNormalized: key,
        namaProduk: item.namaProduk,
        orders: new Set<string>(),
        qtyValid: 0,
        omzet: 0,
      }
      skuMap.set(key, entry)
    }
    entry.orders.add(item.noPesanan)
    entry.qtyValid += item.qtyValid
    entry.omzet += item.omzetValid
  }

  const issues: HppIssue[] = []
  for (const entry of skuMap.values()) {
    issues.push({
      sku: entry.sku,
      skuNormalized: entry.skuNormalized,
      namaProduk: entry.namaProduk,
      orderCount: entry.orders.size,
      qtyValidTerdampak: entry.qtyValid,
      omzetTerkait: entry.omzet,
      contohNoPesanan: [...entry.orders].slice(0, 5),
    })
  }

  return issues
}

// ─── Dashboard Summary ───

export function buildSummary(headers: OrderHeader[]): DashboardSummary {
  let totalOmzet = 0
  let totalHpp = 0
  let totalIncome = 0
  let totalProfit = 0
  let totalPenyesuaian = 0
  let totalOrder = headers.length
  let orderNormal = 0
  let orderReturSebagian = 0
  let orderReturFull = 0
  let orderBatal = 0
  let hppLengkapCount = 0
  let hppSebagianCount = 0
  let hppKosongCount = 0
  let belumAdaIncome = 0

  for (const order of headers) {
    totalOmzet += order.totalOmzetValid
    totalHpp += order.totalHppValid
    totalIncome += order.incomeAktual ?? 0
    totalProfit += order.profitSetelahPenyesuaian
    totalPenyesuaian += order.totalPenyesuaian

    switch (order.statusOrderFinal) {
      case "Selesai / Normal": orderNormal++; break
      case "Retur Sebagian": orderReturSebagian++; break
      case "Retur Full": orderReturFull++; break
      case "Batal": orderBatal++; break
    }

    if (order.statusOrderFinal !== "Batal") {
      switch (order.statusHpp) {
        case "HPP Lengkap": hppLengkapCount++; break
        case "HPP Sebagian": hppSebagianCount++; break
        case "HPP Kosong": hppKosongCount++; break
      }
    }

    if (order.statusIncome === "Belum Ada Income") {
      belumAdaIncome++
    }
  }

  const profitMargin = totalOmzet > 0 ? (totalProfit / totalOmzet) * 100 : 0

  return {
    totalOmzet,
    totalHpp,
    totalIncome,
    totalProfit,
    totalPenyesuaian,
    totalOrder,
    orderNormal,
    orderReturSebagian,
    orderReturFull,
    orderBatal,
    profitMargin,
    hppLengkapCount,
    hppSebagianCount,
    hppKosongCount,
    belumAdaIncome,
  }
}
