import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_FILE = path.join(process.cwd(), "models", "phc-1.onnx");
const MODEL_ORIGIN = process.env.PHC_MODEL_URL
  || "https://media.githubusercontent.com/media/ihatebaselines/purcar.me/refs/heads/main/models/phc-1.onnx?v=phc-1-onnx-1";

function modelHeaders(source: HeadersInit = {}) {
  const headers = new Headers(source);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Content-Disposition", 'inline; filename="phc-1.onnx"');
  headers.set("Content-Type", "application/octet-stream");
  headers.set("X-Content-Type-Options", "nosniff");
  return headers;
}

async function serveModelOrigin(request: NextRequest) {
  if (!MODEL_ORIGIN) return null;

  const requestHeaders = new Headers();
  const range = request.headers.get("range");
  if (range) requestHeaders.set("range", range);

  let upstream: Response;
  try {
    upstream = await fetch(MODEL_ORIGIN, { headers: requestHeaders, redirect: "follow" });
  } catch {
    return new Response("PHC-1 model storage could not be reached.", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("PHC-1 model storage is unavailable. Check PHC_MODEL_URL.", { status: 503 });
  }

  const headers = modelHeaders(upstream.headers);
  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function GET(request: NextRequest) {
  // Cloudflare Workers cannot read a large Git LFS file from the application
  // bundle, so production streams the public GitHub LFS object instead.
  const remoteResponse = await serveModelOrigin(request);
  if (remoteResponse) return remoteResponse;

  let file;
  try {
    file = await stat(MODEL_FILE);
  } catch {
    return new Response(
      "PHC-1 model storage is not configured. Set PHC_MODEL_URL to a public model object URL.",
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const headers = modelHeaders({
    "Last-Modified": file.mtime.toUTCString(),
    ETag: `W/"${file.size.toString(16)}-${Math.trunc(file.mtimeMs).toString(16)}"`,
  });
  const range = request.headers.get("range");
  let start = 0;
  let end = file.size - 1;
  let status = 200;

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
  const stream = createReadStream(MODEL_FILE, { start, end });
  return new Response(Readable.toWeb(stream) as ReadableStream, { status, headers });
}
