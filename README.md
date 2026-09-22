# ShieldTX — Your edge. Protected.

Static, responsive website based on the approved blue geometry direction.

## Run locally

```sh
python3 -m http.server 4193 --bind 127.0.0.1 --directory dist
```

Open http://localhost:4193/. No build step or package installation is required.

## Implementation

- `dist/model.js`: genuine Three.js institution with four distinct fluted pillars, an extruded pediment, capitals, an entablature and four stepped treads. No raster images or image textures. Includes a lit sphere, procedural glow and geometric drafting rings; white architectural linework uses depth-only surfaces to occlude hidden edges.
- `dist/app.js`: reversible GSAP scroll transitions, trade flow, mobile navigation, wallet scanner handoff and reduced-motion controls.
- `dist/style.css`: cobalt blue, serif display type, geometric grid, generous side and section spacing, responsive layouts.
- `dist/index.html`: product narrative, official ShieldTX logo, API CTA, ten FAQ topics and separate footer.

Desktop: the institution stays attached to its original position in the hero and fades while a separate orb layer descends; eight labelled incoming threats cycle only after the orb arrives. On mobile, the institution also stays in the hero, while the orb transitions between dedicated visual areas clear of the copy. The problem section retains its own faint orbit lines. Trade steps are also clickable. Scrolling and content stay accessible with motion disabled.

## Product integration boundary

Request-access buttons link to ShieldTX's official contact page. The wallet exposure dialog validates a public wallet address and opens ShieldTX's official scanner. It does not create accounts, submit trades, connect a wallet or fabricate exposure results.

## Verification

Browser checked at 1440px desktop, 820px tablet and 390px mobile: real WebGL canvases, hero/problem transition, trade-flow controls, responsive bounds, mobile navigation, scanner dialog, FAQ expansion and reduced motion. Ten FAQ topics are included. JavaScript syntax validated with Node.

## Hosting

The source site is in `dist/` on `main`. The `gh-pages` branch contains those
same files at its root for GitHub Pages publishing.

Repository **Settings → Pages** should use **Deploy from a branch**, with
branch **gh-pages** and folder **/ (root)**. No build step or secrets are needed;
fonts and browser libraries are included locally.

Site address after deployment: https://eeshitaaa.github.io/shieldtx/

After updating and committing the source, publish with:

```sh
git push origin main
git subtree push --prefix dist origin gh-pages
```

To use another static host, upload the contents of `dist/` as its web root.
