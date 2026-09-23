# ShieldTX — concept v2

An independent iteration of [Eeshita's ShieldTX concept](https://github.com/eeshitaaa/shieldtx), retaining its architectural drawing style, serif typography and cobalt identity.

The [plan](PLAN.md) was written before implementation. This version prioritises clear product language, terminal access, a visible wallet scanner, and an inspectable four-step walkthrough. Trading activity remains public; the funding-wallet association is what the site explains as shielded.

## Run

```sh
npm run dev
```

Open `http://127.0.0.1:4193`. No installation or build is needed for local development. The original static source structure remains in `dist/`.

```sh
npm test
npm run build
```

The dependency-free build validates local assets and produces `dist/client/` plus a Cloudflare-compatible `dist/server/index.js`. These generated directories are ignored by Git. Sites metadata is in `.openai/hosting.json`.

## Experience

- **Terminal and API:** separate routes to the official beta terminal and API access page, plus a beta application link.
- **Wallet association:** an illustrative before/after comparison. It never invents exposure scores or processes wallet data.
- **Walkthrough:** four selectable stages, one optional playback sequence on larger screens, pause/replay, and visibility-aware scheduling. Page scrolling is never captured. Reduced motion keeps manual selection available.
- **Architecture:** a dimensional institution and geometric trade object, with a canvas fallback if WebGL is unavailable. Motion is limited to a short entrance and subtle pointer response.
- **Scanner:** validates a public EVM address locally, then opens the official scanner in a new tab. No wallet connection, signature, or transaction occurs here.
- **Product:** a clean frame from the existing official demo, with provenance and product boundaries in [product sources](docs/product-sources.md). It is not presented as a live screenshot.

## Verification

- Seven automated interaction tests cover one-shot playback, stale timer prevention, pause/resume, visibility, reduced motion, replay, and scanner addresses.
- Build verifies local asset/import references.
- HTML checks cover duplicate IDs, anchor/ARIA targets, image labels, and external-link attributes.
- JavaScript syntax checks pass. The architecture model's projection bounds were checked at desktop, mobile, and small diagram sizes.
- Responsive CSS has been reviewed at its defined breakpoints. This iteration has not received a live browser usability/animation review.

## Assets and scope

Original logo, typeface and Three.js assets are retained. The social card was created with built-in ImageGen; exact prompts and provenance are in [social-card.md](docs/social-card.md). This is a concept site, with product actions pointing to official ShieldTX services.

Product information was checked against official sources on 24 September 2026. Universal-token funding and production-wide availability are not claimed.
