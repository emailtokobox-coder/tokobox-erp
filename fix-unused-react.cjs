const fs = require("fs");

const files = [
  "src/components/ui/label.tsx",
  "src/components/ui/switch.tsx",
  "src/components/ui/textarea.tsx",
  "src/features/dashboard/components/KpiCard.tsx",
  "src/features/finance/components/IncomeTable.tsx",
  "src/features/inventory/components/HppResolverTable.tsx",
  "src/features/inventory/components/HppTable.tsx",
  "src/features/inventory/components/StockSaldoTable.tsx",
  "src/features/manual-orders/components/dialogs/ManualOrderDetail.tsx",
  "src/features/manual-orders/components/dialogs/PaymentTracking.tsx",
  "src/features/manual-orders/components/dialogs/StatusFlow.tsx",
  "src/features/manual-orders/components/forms/ManualOrderForm.tsx",
  "src/features/status-tracker/components/StatusKanban.tsx",
  "src/features/supplier/components/SupplierDetail.tsx",
  "src/features/supplier/components/SupplierForm.tsx",
  "src/features/supplier/components/SupplierTable.tsx",
  "app/settings/page.tsx",
];

for (const f of files) {
  let c = fs.readFileSync(f, "utf8");
  c = c.replace('import * as React from "react"\n', "");
  c = c.replace('import * as React from "react";\n', "");
  c = c.replace(/^import \* as React from "react"[;\n]*$/gm, "");
  // Also clean up blank lines left behind
  c = c.replace(/\n{3,}/g, "\n\n");
  fs.writeFileSync(f, c);
  console.log("Removed import * as React:", f);
}

console.log("\nDone");
