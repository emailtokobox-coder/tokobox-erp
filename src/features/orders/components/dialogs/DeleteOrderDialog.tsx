"use client"

import { useState } from "react";

/**
 * @module features/orders/components/dialogs/DeleteOrderDialog
 * Delete confirmation dialog — confirms before permanently removing an order.
 *
 *
 * Architecture:
 *   DeleteOrderDialog → deleteOrderAction → Supabase "orders" + "order_items"
 */


import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteOrderAction } from "@/features/orders/actions";

interface DeleteOrderDialogProps {
  noPesanan: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export default function DeleteOrderDialog({
  noPesanan,
  open,
  onOpenChange,
  onDeleted,
}: DeleteOrderDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteOrderAction(noPesanan);
      if (success) {
        onOpenChange(false);
        onDeleted?.();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
      title="Hapus Pesanan"
      description={`Yakin ingin menghapus pesanan "${noPesanan}"? Semua data order dan item akan dihapus permanen. Aksi ini tidak bisa dibatalkan.`}
      confirmText="Hapus"
      cancelText="Batal"
      variant="destructive"
      isLoading={isDeleting}
    />
  );
}
