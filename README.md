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
- **Wallet association:** two visible comparison rows show what stays public and which association is shielded. No tab switching, invented exposure scores or wallet processing.
- **Walkthrough:** native scrolling advances four selectable stages. A short sticky sequence is used only when the board fits the viewport. Step selection and Replay navigate to the matching stage; reduced motion keeps manual selection available. Wheel and touch scrolling are never captured.
- **Continuous trade:** one geometric cube travels from the institution through the wallet comparison, execution stages, terminal/API, questions and footer. A single native-scroll timeline controls its position, size and contrast. The cube remains within the viewport between sections, including on mobile. A canvas fallback works without WebGL.
- **Credibility:** official Avail branding and a linked “Built by Avail” credit appear above the hero headline and beside product access.
- **Scanner:** validates a public EVM address locally, then opens the official scanner in a new tab. No wallet connection, signature, or transaction occurs here.
- **Product:** a clean frame from the existing official demo, with provenance and product boundaries in [product sources](docs/product-sources.md). It is not presented as a live screenshot.

## Verification

- Two focused automated tests cover valid and invalid scanner addresses.
- Build verifies local asset/import references.
- HTML checks cover duplicate IDs, anchor/ARIA targets, image labels, and external-link attributes.
- JavaScript syntax checks pass. The architecture model's projection bounds were checked at desktop, mobile, and small diagram sizes.
- Local browser checks cover desktop and mobile layouts, full-page cube continuity in both directions, step selection, Replay, motion controls, reduced motion, mobile navigation and scanner validation. Browser screenshots are reviewed for layout and legibility.

## Assets and scope

Original logo, typeface and Three.js assets are retained. The social card was created with built-in ImageGen; exact prompts and provenance are in [social-card.md](docs/social-card.md). This is a concept site, with product actions pointing to official ShieldTX services.

Product information was checked against official sources on 24 September 2026. Universal-token funding and production-wide availability are not claimed.

The [review site](https://shieldtx-concept-v2.tanisha97.chatgpt.site) is public at the user's request and opens without ChatGPT sign-in.
