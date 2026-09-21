# PURCAR ORZ

PURCAR ORZ este un dashboard web de detectie live cu **YOLO12n ONNX**. Camera si inferenta ruleaza local in browser: nu exista backend care primeste imaginile utilizatorului.

## Ce se ruleaza

- `models/yolo12n.onnx` este singurul model folosit.
- `onnxruntime-web` incarca modelul in browser si ruleaza YOLO12n pe cadrele camerei.
- `cpp/wasm/purcarorz_core.cpp` este logica C++17 portabila pentru filtru, prag, jurnal si statistici.
- GitHub Actions o compileaza in WebAssembly (`public/wasm/purcarorz_core.js` si `.wasm`) la fiecare push pe `main`.

## Dezvoltare locala

```powershell
npm install
npm run dev
```

Pentru testare locala, modulul Wasm lipseste pana cand ruleaza workflow-ul GitHub Actions; interfata are un fallback JavaScript pentru jurnal, iar modelul YOLO12n functioneaza in continuare.

## Meniu terminal

- `1` porneste camera si detectia YOLO12n.
- `2` selecteaza camera.
- `3` selecteaza o clasa COCO sau `toate`.
- `4` seteaza pragul de incredere.
- `5` afiseaza statisticile.
- `6` salveaza jurnalul in `localStorage`.
- `7` opreste detectia.
- `0` opreste detectia.

## Publicare pe purcar.me

Workflow-ul `.github/workflows/build-wasm.yml` construieste C++ WebAssembly si site-ul. Workflow-ul `.github/workflows/deploy-pages.yml` publica artefactul pe GitHub Pages.

In repository settings, activeaza **Settings → Pages → GitHub Actions**. Pentru domeniu, seteaza manual `purcar.me` la **Custom domain**; la o publicare cu GitHub Actions, fisierul `CNAME` nu activeaza singur domeniul. Configureaza apoi DNS-ul la registrar conform instructiunilor GitHub Pages. Camera functioneaza public doar prin HTTPS.
