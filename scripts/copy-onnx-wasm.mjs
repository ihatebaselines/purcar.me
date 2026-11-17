import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "node_modules", "onnxruntime-web", "dist");
const destination = path.join(root, "public", "onnxruntime");

await mkdir(destination, { recursive: true });
for (const name of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  await copyFile(path.join(source, name), path.join(destination, name));
}
