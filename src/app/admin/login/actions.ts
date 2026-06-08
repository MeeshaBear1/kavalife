"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error: string | null };

/** Restrict the post-login redirect to in-app paths (no open redirect). */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/admin";
}

export async function authenticate(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const next = safeNext(formData.get("next"));

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin || !(await verifyPassword(parsed.data.password, admin.passwordHash))) {
    return { error: "Incorrect email or password." };
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(admin.id, admin.email);

  // redirect() throws — must be outside any try/catch.
  redirect(next);
}
