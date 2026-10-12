/** Upper case, no spaces: the form an IBAN is stored and compared in. */
export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

/** Format check plus the ISO 7064 mod-97 checksum; expects a normalised IBAN. */
export function isValidIban(iban: string): boolean {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const digits = /\d/.test(char) ? char : String(char.charCodeAt(0) - 55);
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export function isValidBic(bic: string): boolean {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic);
}

/** Groups of four, as banks print it. */
export function formatIban(iban: string): string {
  return normalizeIban(iban).replace(/(.{4})(?=.)/g, "$1 ");
}

export interface EpcRecipient {
  name: string;
  iban: string;
  bic?: string;
  reference?: string;
}

/**
 * The text of an EPC QR code (EPC069-12 v002): service tag BCD, version 002, charset 1 (UTF-8),
 * identification SCT, then BIC, name, IBAN, amount, purpose, structured reference and the free
 * text. The amount stays empty so the donor chooses it in their banking app. Lines are joined by
 * LF with no trailing newline, which the spec allows for omitted trailing elements.
 */
export function epcPayload(recipient: EpcRecipient): string {
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    recipient.bic ?? "",
    recipient.name,
    normalizeIban(recipient.iban),
    "",
    "",
    "",
    recipient.reference ?? "",
  ].join("\n");
}
