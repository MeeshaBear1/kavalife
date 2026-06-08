import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newsletterSchema } from "@/lib/validation";
import { generateDiscountCode } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.newsletterSignup.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: true, discountCode: existing.discountCode, already: true });
  }

  const discountCode = generateDiscountCode();
  await prisma.newsletterSignup.create({
    data: { email, discountCode, source: parsed.data.source ?? null },
  });

  return NextResponse.json({ ok: true, discountCode });
}
