"use server";

import { revalidatePath } from "next/cache";
import { adjustStock } from "@/lib/orders";
import { stockAdjustSchema } from "@/lib/validation";
import { requireAdminAction } from "@/components/admin/require-admin";

export type AdjustState = { error: string | null; success: string | null };

export async function adjustStockAction(
  _prev: AdjustState,
  fd: FormData
): Promise<AdjustState> {
  await requireAdminAction();

  const deltaRaw = fd.get("delta");
  const delta =
    typeof deltaRaw === "string" && deltaRaw.trim() !== ""
      ? Number.parseInt(deltaRaw, 10)
      : NaN;

  const parsed = stockAdjustSchema.safeParse({
    productId: fd.get("productId"),
    delta,
    reason: fd.get("reason"),
    note: typeof fd.get("note") === "string" && (fd.get("note") as string).trim() !== ""
      ? (fd.get("note") as string)
      : undefined,
  });

  if (!parsed.success) {
    return { error: "Enter a whole-number quantity and a reason.", success: null };
  }
  if (parsed.data.delta === 0) {
    return { error: "Quantity can’t be zero.", success: null };
  }

  try {
    await adjustStock({
      productId: parsed.data.productId,
      delta: parsed.data.delta,
      reason: parsed.data.reason,
      note: parsed.data.note,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not apply the adjustment.";
    return { error: message, success: null };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/admin");

  const verb = parsed.data.delta > 0 ? "Added" : "Removed";
  return {
    error: null,
    success: `${verb} ${Math.abs(parsed.data.delta)} unit${
      Math.abs(parsed.data.delta) === 1 ? "" : "s"
    }.`,
  };
}
