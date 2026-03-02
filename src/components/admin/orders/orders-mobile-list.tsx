"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/orders";
import { OrderMobileCard, type MobileOrderCardItem } from "@/components/admin/orders/order-mobile-card";
import { SwipeableRow } from "@/components/admin/shared/swipeable-row";

async function archiveOrder(orderId: string) {
  const formData = new FormData();
  formData.set("order_id", orderId);
  formData.set("status", "archived");
  return updateOrderStatusAction(formData);
}

export function OrdersMobileList({ orders }: { orders: MobileOrderCardItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleArchive = (orderId: string) => {
    startTransition(() => {
      toast.promise(archiveOrder(orderId), {
        loading: "Архівуємо замовлення...",
        success: (result) => {
          if (!result.ok) {
            throw new Error(result.message);
          }
          router.refresh();
          return "Замовлення архівовано.";
        },
        error: "Не вдалося архівувати замовлення.",
      });
    });
  };

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <SwipeableRow
          key={order.id}
          onSwipeLeft={() => handleArchive(order.id)}
          onSwipeRight={() => router.push(`/admin/orders/${order.id}`)}
        >
          <div className={pending ? "opacity-80" : undefined}>
            <OrderMobileCard order={order} />
          </div>
        </SwipeableRow>
      ))}
    </div>
  );
}
