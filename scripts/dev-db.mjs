// Zero-Docker, zero-native-deps local Postgres for development.
//
// Runs PGlite (PostgreSQL compiled to WebAssembly — pure JS, no Docker, no
// system install, no native binaries) and exposes it over a TCP socket on the
// host port that `.env` points at, speaking the real Postgres wire protocol so
// Prisma / psql / any pg client can connect normally:
//
//   postgresql://kava:kava_dev_password@localhost:5434/kavalife?connection_limit=1
//
// Usage:
//   npm run db:dev          # start in this terminal, leave it running
//   (then in another terminal)  npm run db:push && npm run db:seed && npm run dev
//
// Data persists in ./.pglite (gitignored). Ctrl-C stops it cleanly.
//
// NOTE: PGlite serves a single client connection at a time, so the dev
// DATABASE_URL pins `connection_limit=1`. That's plenty for local development.
//
// PRODUCTION does NOT use this — deploy against a managed Postgres (Supabase,
// Railway, RDS, the docker-compose `db` service, etc.) via DATABASE_URL.

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", ".pglite");
const PORT = 5434;
const HOST = "127.0.0.1";

async function main() {
  const db = await PGlite.create({ dataDir });
  // Touch the database so the cluster is fully initialised before clients connect.
  await db.query("SELECT 1");

  // maxConnections defaults to 1; Prisma opens a small pool, so allow several.
  // PGlite still executes one query at a time internally (queries are queued),
  // so this just multiplexes Prisma's connections safely.
  const server = new PGLiteSocketServer({ db, port: PORT, host: HOST, maxConnections: 20 });
  server.addEventListener?.("error", (e) => console.error("[pglite-socket] error:", e?.detail ?? e));
  await server.start();

  console.log("");
  console.log(`• PGlite (Postgres ${await pgVersion(db)}) listening on ${HOST}:${PORT}`);
  console.log(`• data dir: ${dataDir}`);
  console.log("");
  console.log("  DATABASE_URL=postgresql://kava:kava_dev_password@localhost:5434/kavalife?connection_limit=1");
  console.log("  Ready. Leave this running; Ctrl-C to stop.");
  console.log("");

  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(`\n• ${signal} received — stopping …`);
    try {
      await server.stop();
      await db.close();
    } catch {
      /* already down */
    }
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

async function pgVersion(db) {
  try {
    const r = await db.query("SHOW server_version");
    return r.rows?.[0]?.server_version ?? "16";
  } catch {
    return "16";
  }
}

main().catch((err) => {
  console.error("Failed to start PGlite dev DB:", err);
  process.exit(1);
});
