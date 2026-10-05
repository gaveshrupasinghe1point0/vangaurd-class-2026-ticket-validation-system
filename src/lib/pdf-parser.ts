// Utility: parse bank receipt PDFs (any bank) and extract payment info
import { extractReferenceNIC, extractAmount } from './receipt-reference';

export interface ParsedReceipt {
  amount: number | null;
  nic: string | null;
  reference: string | null;
  transactionRef: string | null;
  paymentTime: string | null;
  suspicious: boolean;
  suspicionReason: string;
}

/** Parse already-extracted receipt text (shared by PDF + OCR'd images). */
export function parseReceiptText(text: string): ParsedReceipt {
  const nic = extractReferenceNIC(text);
  const reference = nic;
  const amount = extractAmount(text);

  // Bank's own transaction number — common formats across banks
  const txnRefMatch =
    text.match(/Reference\s+(?:Number|No)\.?\s*[-:]?\s*([\w\/]+)/i) ||
    text.match(/Transaction\s+(?:Reference|No)\.?\s*[-:]?\s*([\w\/]+)/i) ||
    text.match(/Txn\s*Ref\s*[-:]?\s*([\w\/]+)/i);
  const transactionRef = txnRefMatch ? txnRefMatch[1] : null;

  // Date/time: 04/10/2026 20:02:15 or 2026/10/03 07:25:26
  const timeMatch =
    text.match(/(\d{4}[\/\-]\d{2}[\/\-]\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/) ||
    text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{2,4}\s+\d{2}:\d{2}(?::\d{2})?)/);
  const paymentTime = timeMatch ? timeMatch[1] : null;

  let suspicious = false;
  let suspicionReason = '';

  if (!nic) {
    suspicious = true;
    suspicionReason = 'No NIC reference found on the receipt.';
  } else if (amount === null) {
    suspicious = true;
    suspicionReason = 'Could not read the amount from the receipt.';
  } else if (amount !== 6500) {
    suspicious = true;
    suspicionReason = `Amount mismatch: expected LKR 6,500.00 but receipt shows LKR ${amount.toLocaleString()}`;
  }

  return { amount, nic, reference, transactionRef, paymentTime, suspicious, suspicionReason };
}

export async function parseReceiptPDF(buffer: Buffer): Promise<ParsedReceipt> {
  const { extractText } = await import('unpdf');
  const { text: pages } = await extractText(new Uint8Array(buffer), { mergePages: true });
  const text = Array.isArray(pages) ? pages.join(' ') : String(pages);
  return parseReceiptText(text);
}
