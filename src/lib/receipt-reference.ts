// Shared helpers to pull the attendee's NIC (used as the payment reference)
// out of free-form receipt text — bank PDFs, OCR'd slip photos, etc.

// Our own HNB account number — must never be mistaken for a NIC
const OWN_ACCOUNT_NUMBERS = ['223020164563'];

// A NIC that is NOT glued to other digits/letters (so we never grab 12 digits
// out of a longer bank reference like 2610041823892810)
const NIC_TOKEN = '(\\d{12}|\\d{9}[VvXx])(?![\\dA-Za-z])';

/** Sanity-check a NIC: real birth year + valid day-of-year (females +500). */
export function isPlausibleNIC(raw: string): boolean {
  const nic = raw.toUpperCase();
  let year: number;
  let day: number;

  if (/^\d{12}$/.test(nic)) {
    year = parseInt(nic.slice(0, 4), 10);
    day = parseInt(nic.slice(4, 7), 10);
  } else if (/^\d{9}[VX]$/.test(nic)) {
    year = 1900 + parseInt(nic.slice(0, 2), 10);
    day = parseInt(nic.slice(2, 5), 10);
  } else {
    return false;
  }

  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (day > 500) day -= 500;
  return day >= 1 && day <= 366;
}

/**
 * Find the NIC reference inside receipt text.
 * 1. Prefer a NIC sitting right after a reference-style label
 *    (Remarks / Reason / Narration / Description / Purpose / REFERENCE),
 *    e.g. "Remarks ID. 200731904267" or "REFERENCE : 200715102440".
 *    "Reference Number" is skipped — that's the bank's own transaction number.
 * 2. Otherwise fall back to a single unambiguous NIC anywhere in the text.
 */
export function extractReferenceNIC(text: string): string | null {
  const labeled = new RegExp(
    '(?:Remarks?|Reason|Narration|Description|Purpose|Reference(?!\\s*(?:Number|No)))' +
      '\\s*[:.\\-]?\\s*(?:ID|NIC|No)?\\s*[:.\\-]?\\s*' +
      NIC_TOKEN,
    'gi'
  );

  for (const m of text.matchAll(labeled)) {
    const nic = m[1].toUpperCase();
    if (!OWN_ACCOUNT_NUMBERS.includes(nic) && isPlausibleNIC(nic)) return nic;
  }

  // Fallback: any standalone NIC-shaped token, only if exactly one plausible candidate
  const loose = new RegExp('(?<![\\dA-Za-z])' + NIC_TOKEN, 'g');
  const candidates = new Set<string>();
  for (const m of text.matchAll(loose)) {
    const nic = m[1].toUpperCase();
    if (!OWN_ACCOUNT_NUMBERS.includes(nic) && isPlausibleNIC(nic)) candidates.add(nic);
  }
  return candidates.size === 1 ? [...candidates][0] : null;
}

/** Find the transfer amount. Returns 6500 if that figure appears anywhere, else the first amount found. */
export function extractAmount(text: string): number | null {
  const amounts = [...text.matchAll(/(?<![\d.])(\d{1,3}(?:,\d{3})+|\d+)\.\d{2}(?!\d)/g)].map(m =>
    parseFloat(m[0].replace(/,/g, ''))
  );
  if (amounts.length === 0) return null;
  return amounts.includes(6500) ? 6500 : amounts[0];
}
