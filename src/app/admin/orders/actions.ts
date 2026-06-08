"use server";

import { revalidatePath } from "next/cache";
import {
  markOrderPaid,
  markOrderFulfilled,
  closeOrder,
} from "@/lib/orders";
import { requireAdminAction } from "@/components/admin/require-admin";

function getId(fd: FormData): string {
  const id = fd.get("id");
  if (typeof id !== "string" || !id) throw new Error("Missing order id");
  return id;
}

function revalidateOrder(id: string) {
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
}

export async function markPaidAction(fd: FormData): Promise<void> {
  await requireAdminAction();
  const id = getId(fd);
  await markOrderPaid(id);
  revalidateOrder(id);
}

export async function markFulfilledAction(fd: FormData): Promise<void> {
  await requireAdminAction();
  const id = getId(fd);
  await markOrderFulfilled(id);
  revalidateOrder(id);
}

export async function cancelOrderAction(fd: FormData): Promise<void> {
  await requireAdminAction();
  const id = getId(fd);
  await closeOrder(id, "CANCELLED");
  revalidateOrder(id);
}

export async function refundOrderAction(fd: FormData): Promise<void> {
  await requireAdminAction();
  const id = getId(fd);
  await closeOrder(id, "REFUNDED");
  revalidateOrder(id);
}
