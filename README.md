This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## HexoChem Studio model

PHC-1 predictions run in the visitor's browser with ONNX Runtime WebAssembly. The model file lives at `models/phc-1.onnx` and is fetched through `/download/model` when the visitor first predicts; the browser Cache API keeps a copy for later visits. The runtime's WASM files are copied from the installed package before `npm run dev` and `npm run build`.

For deployment on Cloudflare, `/download/model` redirects the browser to the public GitHub LFS object so the large response is served directly by GitHub's file CDN. The model is about 203 MB, so it cannot be shipped as a Cloudflare static asset or bundled into the Worker. Set the Worker runtime variable `PHC_MODEL_URL` only if the model is moved to another public object URL. Browser inference requires sending the model to the visitor; anyone can save a copy of the file.

SMILES parsing runs locally in the browser through RDKit WebAssembly, so the Load buttons do not need the chemistry API. Random organic and inorganic dataset examples still use the optional Python API. Set `HEXOCHEM_API_URL` to a deployed API base URL if those examples should work on the hosted site. Locally, the development default is `http://127.0.0.1:7860`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
