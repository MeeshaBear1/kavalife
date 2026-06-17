import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const EXT_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

/**
 * Save an uploaded product photo.
 *
 * On Vercel (BLOB_READ_WRITE_TOKEN is set) photos are stored in Vercel Blob
 * and return a persistent cdn.vercel-storage.com URL. In local dev / Docker
 * they go to the local filesystem (UPLOAD_DIR or ./uploads) and return a
 * /uploads/<filename> path served by the app itself.
 */
export async function saveUpload(file: File): Promise<{ url: string; filename: string }> {
  const ext = ALLOWED[file.type];
  if (!ext) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, GIF, or AVIF.");
  }
  if (file.size <= 0) throw new Error("The file is empty.");
  if (file.size > MAX_BYTES) throw new Error("File too large (max 8 MB).");

  const filename = `products/${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, file, { access: "public" });
    return { url: blob.url, filename };
  }

  // Local filesystem fallback (dev + Docker).
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = getUploadDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, path.basename(filename)), buf);
  return { url: `/uploads/${path.basename(filename)}`, filename };
}

/** Read an uploaded file from the local filesystem (dev/Docker only). */
export async function readUpload(
  requested: string
): Promise<{ data: Buffer; contentType: string } | null> {
  const safe = path.basename(requested);
  if (!/^[A-Za-z0-9._-]+$/.test(safe) || safe.includes("..")) return null;

  const dir = getUploadDir();
  const full = path.join(dir, safe);
  const rel = path.relative(dir, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;

  try {
    const data = await fs.readFile(full);
    const ext = path.extname(safe).slice(1).toLowerCase();
    return { data, contentType: EXT_CONTENT_TYPE[ext] || "application/octet-stream" };
  } catch {
    return null;
  }
}
