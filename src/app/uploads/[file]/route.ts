import { NextResponse } from "next/server";
import { readUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves uploaded product images from the upload directory (a Docker volume in
// production), with path-traversal protection in readUpload().
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const result = await readUpload(file);
  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(new Uint8Array(result.data), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
