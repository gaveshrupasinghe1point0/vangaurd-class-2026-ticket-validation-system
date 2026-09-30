// Utility: parse bank receipt PDFs (any bank) and extract payment info
export interface ParsedReceipt {
  amount: number | null;
  nic: string | null;
  reference: string | null;
  transactionRef: string | null;
  paymentTime: string | null;
  suspicious: boolean;
  suspicionReason: string;
}

export async function parseReceiptPDF(buffer: Buffer): Promise<ParsedReceipt> {
  const { extractText } = await import('unpdf');

  // unpdf returns { text: string[] } where each element is a page
  const { text: pages } = await extractText(new Uint8Array(buffer), { mergePages: true });
  const text = Array.isArray(pages) ? pages.join(' ') : String(pages);

  // DEBUG — log extracted text so we can see what the PDF contains
  console.log('=== PDF EXTRACTED TEXT ===');
  console.log(text);
  console.log('==========================');

  // Search entire PDF text for vanguard{NIC} pattern — works for ANY bank
  const refMatch = text.match(/vanguard([a-zA-Z0-9]+)/i);
  const nic = refMatch ? refMatch[1] : null;
  const reference = refMatch ? refMatch[0] : null;

  // Search for amount — handles formats: LKR 6,500.00 / Rs.6,500.00 / 6500.00 / 6,500.00
  const amountMatch = text.match(/(?:LKR|Rs\.?)\s*([\d,]+\.?\d*)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

  // Transaction reference — common formats across banks
  const txnRefMatch = text.match(/[Tt]ransaction\s+[Rr]eference\s*[-:]\s*([\w\/]+)/i)
    || text.match(/[Tt]xn\s*[Rr]ef\s*[-:]\s*([\w\/]+)/i)
    || text.match(/[Rr]eference\s+[Nn]o\s*[-:]\s*([\w\/]+)/i);
  const transactionRef = txnRefMatch ? txnRefMatch[1] : null;

  // Try to extract a date/time from the PDF
  const timeMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{2,4}\s+\d{2}:\d{2}(?::\d{2})?)/);
  const paymentTime = timeMatch ? timeMatch[1] : null;

  // Suspicion checks
  let suspicious = false;
  let suspicionReason = '';

  if (!nic) {
    suspicious = true;
    suspicionReason = 'No "vanguard" reference found in PDF. Wrong receipt or incorrect reference used.';
  } else if (amount !== null && amount !== 6500) {
    suspicious = true;
    suspicionReason = `Amount mismatch: expected LKR 6,500.00 but PDF shows LKR ${amount?.toLocaleString() ?? 'unknown'}`;
  } else if (amount === null) {
    suspicious = true;
    suspicionReason = 'Could not extract amount from PDF. Manual review required.';
  }

  return { amount, nic, reference, transactionRef, paymentTime, suspicious, suspicionReason };
}
