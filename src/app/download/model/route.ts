import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const filePath = path.join(process.cwd(), "models", "phc-1.onnx");

  let file;
  try {
    file = await stat(filePath);
  } catch {
    return new Response("PHC-1 ONNX model file is unavailable.", { status: 404 });
  }

  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": "application/octet-stream",
    "Content-Disposition": 'inline; filename="phc-1.onnx"',
    "Last-Modified": file.mtime.toUTCString(),
    ETag: `W/"${file.size.toString(16)}-${Math.trunc(file.mtimeMs).toString(16)}"`,
    "X-Content-Type-Options": "nosniff",
  };

  const range = request.headers.get("range");
  let start = 0;
  let end = file.size - 1;
  let status = 200;
  const headers = new Headers(baseHeaders);

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${file.size}` } });
    if (match[1]) start = Number(match[1]);
    if (match[2]) end = Number(match[2]);
    if (!match[1] && match[2]) start = Math.max(0, file.size - Number(match[2]));
    end = Math.min(end, file.size - 1);
    if (start > end || start >= file.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${file.size}` } });
    }
    status = 206;
    headers.set("Content-Range", `bytes ${start}-${end}/${file.size}`);
  }

  headers.set("Content-Length", String(end - start + 1));
  const stream = createReadStream(filePath, { start, end });
  return new Response(Readable.toWeb(stream) as ReadableStream, { status, headers });
}
