"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";
import { settingsSchema } from "@/lib/validation";
import { requireAdminAction } from "@/components/admin/require-admin";

export type SettingsState = {
  error: string | null;
  success: boolean;
  fieldErrors?: Record<string, string>;
};

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function optStr(fd: FormData, key: string): string | null {
  const s = str(fd, key);
  return s.length > 0 ? s : null;
}

export async function updateSettings(
  _prev: SettingsState,
  fd: FormData
): Promise<SettingsState> {
  await requireAdminAction();

  const percentRaw = str(fd, "taxRatePercent");
  const percent = percentRaw === "" ? 0 : Number.parseFloat(percentRaw);
  const taxRateBps = Number.isNaN(percent) ? NaN : Math.round(percent * 100);

  const candidate = {
    storeName: str(fd, "storeName"),
    announcement: optStr(fd, "announcement"),
    supportEmail: str(fd, "supportEmail"),
    flatShippingCents: dollarsToCents(str(fd, "flatShipping") || "0"),
    freeShippingThresholdCents: dollarsToCents(str(fd, "freeShippingThreshold") || "0"),
    taxRateBps,
  };

  const parsed = settingsSchema.safeParse(candidate);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      error: "Please fix the highlighted fields.",
      success: false,
      fieldErrors,
    };
  }

  const data = parsed.data;
  await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  revalidatePath("/admin/settings");
  return { error: null, success: true };
}
