import { getCurrentAdmin } from "@/lib/auth";

/**
 * Defense-in-depth auth guard for server actions. The middleware + the
 * (dash) layout already gate access, but every mutating action calls this at
 * the top so a forged/expired session can never mutate data.
 *
 * NOTE: this is intentionally a plain async module function — NOT a server
 * action — so it can be imported and awaited inside "use server" files.
 */
export async function requireAdminAction() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");
  return admin;
}
