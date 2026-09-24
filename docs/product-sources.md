# Product sources

Reviewed 24 September 2026. These notes ground the concept in ShieldTX's public descriptions; they are not an independent technical validation.

## Product status and boundaries

[Official website](https://www.shieldtx.xyz/): private beta; USDC funding; a fresh account for each trade; a short delay before orders reach Hyperliquid. Deposits, solver activity, trading accounts, and withdrawals remain visible. The claimed protection concerns their public association with the funding wallet. Universal token funding is not verified.

[Trust model](https://www.shieldtx.xyz/trust-model/): USDC reaches an Arbitrum vault through Avail Nexus. The user and ShieldTX can see the internal balance. A withdrawal requires protocol confirmation before the user signs a claim. Avoid implying invisible onchain activity, exclusive user visibility, or unconditional immediate withdrawals.

## Live destinations

- [Terminal](https://beta.shieldtx.xyz/)
- [Beta application](https://www.shieldtx.xyz/request-access)
- [API application](https://www.shieldtx.xyz/api-access/)
- [Wallet scanner](https://scanner.shieldtx.xyz/)

## Product image provenance

`dist/assets/terminal-preview.jpg` is the complete frame at **00:02** from ShieldTX's [official product recording](https://www.shieldtx.xyz/assets/demo/preview.mp4). Extracted with FFmpeg; 1144 × 720 pixels; no retouching or invented interface elements. The page crops its surrounding video background using CSS; the source image is unchanged.

The inspected frame shows a disconnected terminal without an email, login code, or connected-wallet identifier. Its Avail branding and Bybit chart label establish that it is an existing demonstration, not a verified capture of today's application. The original poster contains an email login dialog and was not used.

The 21.4 MiB recording remains remote. It includes login details later in the sequence; treat it as the publisher's existing demo rather than a privacy-cleared recording. The local still avoids that portion.

## Avail credit and reference

The user supplied “Built by Avail” as the product credit. [Avail’s website](https://www.availproject.org/) lists ShieldTX under its user products and labs. The credit links there; it does not reuse unrelated product statistics or testimonials as ShieldTX endorsements.

`dist/assets/avail-logo.svg` is the official [blue Avail logo](https://www.availproject.org/assets/brand/Avail%20Logo%20-%20Blue.svg), linked from the [brand page](https://www.availproject.org/brand). The original vector is unchanged and displayed white through CSS.
