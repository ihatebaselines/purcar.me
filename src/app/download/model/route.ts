import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_ORIGIN = process.env.PHC_MODEL_URL
  || "https://media.githubusercontent.com/media/ihatebaselines/purcar.me/refs/heads/main/models/phc-1.onnx?v=phc-1-onnx-1";

export function GET() {
  let destination: URL;
  try {
    destination = new URL(MODEL_ORIGIN);
  } catch {
    return new Response("PHC-1 model URL is invalid.", { status: 503 });
  }

  if (destination.protocol !== "https:") {
    return new Response("PHC-1 model URL must use HTTPS.", { status: 503 });
  }

  // Redirect the browser to GitHub's public LFS object. Streaming 203 MB
  // through the OpenNext Worker truncates the body; the redirect keeps the
  // large response between the browser and GitHub's byte-range capable CDN.
  return NextResponse.redirect(destination, {
    status: 307,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
