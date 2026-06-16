import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Allowed upload MIME types -> file extension.
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

/** Directory uploads are written to. Override with UPLOAD_DIR (a Docker volume in prod). */
export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

export async function saveUpload(file: File): Promise<{ url: string; filename: string }> {
  const ext = ALLOWED[file.type];
  if (!ext) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, GIF, or AVIF.");
  }
  if (file.size <= 0) {
    throw new Error("The file is empty.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File too large (max 8 MB).");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  // Vercel Blob: persistent object storage. Required on Vercel, whose runtime
  // filesystem is ephemeral — local writes would vanish on the next deploy.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`products/${filename}`, buf, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, filename };
  }

  // Local-disk fallback (Docker volume / local dev).
  const dir = getUploadDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buf);

  return { url: `/uploads/${filename}`, filename };
}

/** Reads an uploaded file safely (path-traversal hardened). Returns null if missing/invalid. */
export async function readUpload(
  requested: string
): Promise<{ data: Buffer; contentType: string } | null> {
  const safe = path.basename(requested); // strip any directory components
  if (!/^[A-Za-z0-9._-]+$/.test(safe) || safe.includes("..")) return null;

  const dir = getUploadDir();
  const full = path.join(dir, safe);
  // Defense in depth: ensure the resolved path stays within the upload dir.
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
