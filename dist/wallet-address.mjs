/** Validate and normalise a public EVM address before the scanner handoff. */
export function normaliseWallet(value) {
  const address=String(value).trim();
  return /^0x[a-fA-F0-9]{40}$/.test(address)?address.toLowerCase():null;
}
