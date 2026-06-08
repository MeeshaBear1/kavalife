import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** RFC-4180 cell escaping: wrap in quotes and double any embedded quotes. */
function csvCell(value: string | null | undefined): string {
  const s = value ?? "";
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signups = await prisma.newsletterSignup.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = ["Email", "Discount Code", "Source", "Signed Up"];
  const rows = signups.map((s) =>
    [
      csvCell(s.email),
      csvCell(s.discountCode),
      csvCell(s.source),
      csvCell(s.createdAt.toISOString()),
    ].join(",")
  );

  // Prepend a UTF-8 BOM so Excel reads accented characters correctly.
  const csv = "﻿" + [header.join(","), ...rows].join("\r\n") + "\r\n";

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
