import "server-only";
import { StockReason, OrderStatus } from "@prisma/client";
import { prisma } from "./db";

/**
 * Idempotently mark an order PAID: decrement stock + write a SALE movement for
 * each line exactly once. Safe to call from the Stripe webhook, the mock
 * checkout path, and the admin "mark paid" action — re-calls are no-ops.
 */
export async function markOrderPaid(orderId: string, opts?: { paymentIntentId?: string }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");

    // Already counted against stock — don't double-deduct.
    if (order.status === OrderStatus.PAID || order.status === OrderStatus.FULFILLED) {
      return order;
    }

    for (const item of order.items) {
      if (!item.productId) continue;
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const balance = product.stock - item.quantity;
      await tx.product.update({ where: { id: product.id }, data: { stock: balance } });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          delta: -item.quantity,
          balance,
          reason: StockReason.SALE,
          note: `Sale · order ${order.orderNumber}`,
          orderId: order.id,
        },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: opts?.paymentIntentId ?? order.stripePaymentIntentId,
      },
    });
  });
}

export async function markOrderFulfilled(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.FULFILLED, fulfilledAt: new Date() },
  });
}

/**
 * Cancel or refund an order. If stock had already been deducted (PAID/FULFILLED)
 * the items are returned to inventory with a RETURN movement — once.
 */
export async function closeOrder(orderId: string, newStatus: "CANCELLED" | "REFUNDED") {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      return order;
    }

    const wasDeducted =
      order.status === OrderStatus.PAID || order.status === OrderStatus.FULFILLED;
    if (wasDeducted) {
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const balance = product.stock + item.quantity;
        await tx.product.update({ where: { id: product.id }, data: { stock: balance } });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            delta: item.quantity,
            balance,
            reason: StockReason.RETURN,
            note: `${newStatus} · order ${order.orderNumber}`,
            orderId: order.id,
          },
        });
      }
    }

    return tx.order.update({ where: { id: order.id }, data: { status: newStatus } });
  });
}

/** Apply a manual inventory delta and record the movement, transactionally. */
export async function adjustStock(input: {
  productId: string;
  delta: number;
  reason: StockReason;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new Error("Product not found");
    const balance = product.stock + input.delta;
    if (balance < 0) throw new Error("Adjustment would drive stock below zero.");
    await tx.product.update({ where: { id: product.id }, data: { stock: balance } });
    return tx.stockMovement.create({
      data: {
        productId: product.id,
        delta: input.delta,
        balance,
        reason: input.reason,
        note: input.note,
      },
    });
  });
}
