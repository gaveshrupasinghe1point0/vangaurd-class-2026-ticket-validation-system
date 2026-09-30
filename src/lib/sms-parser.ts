// Utility: parse HNB bank SMS messages and extract payment info
export interface ParsedSMS {
  amount: number;
  nic: string;
  reference: string;
  timestamp: string;
  balance: number;
  raw: string;
  suspicious: boolean;
  suspicionReason?: string;
}

export function parseBankSMS(text: string): ParsedSMS[] {
  const results: ParsedSMS[] = [];
  // Split by newlines or double newlines to handle multiple messages pasted at once
  const messages = text.split(/\n{2,}|\r\n{2,}/).map(m => m.trim()).filter(Boolean);

  for (const msg of messages) {
    try {
      // Amount: LKR 6,500.00 credited
      const amountMatch = msg.match(/LKR\s*([\d,]+\.?\d*)\s*credited/i);
      // Timestamp: on 01/10/26 03:44:51
      const timeMatch = msg.match(/on\s+(\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})/i);
      // Reference: Reason:vanguard{NIC}
      const refMatch = msg.match(/[Rr]eason\s*:?\s*(vanguard\w+)/i);
      // Balance: Bal:LKR 6,500.96
      const balMatch = msg.match(/Bal\s*:?\s*LKR\s*([\d,]+\.?\d*)/i);

      if (!amountMatch) continue; // Not a valid credit SMS, skip

      const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      const timestamp = timeMatch ? timeMatch[1] : 'Unknown';
      const balance = balMatch ? parseFloat(balMatch[1].replace(/,/g, '')) : 0;
      const reference = refMatch ? refMatch[1] : '';

      // Extract NIC from reference (everything after "vanguard")
      const nicMatch = reference.match(/vanguard(\w+)/i);
      const nic = nicMatch ? nicMatch[1] : '';

      let suspicious = false;
      let suspicionReason = '';

      if (amount !== 6500) {
        suspicious = true;
        suspicionReason = `Amount mismatch: expected LKR 6,500.00 but got LKR ${amount.toLocaleString()}`;
      } else if (!nic) {
        suspicious = true;
        suspicionReason = 'No valid vanguard reference found in SMS';
      } else if (balance < 0) {
        suspicious = true;
        suspicionReason = `Negative balance after transfer: LKR ${balance}`;
      }

      results.push({ amount, nic, reference, timestamp, balance, raw: msg, suspicious, suspicionReason });
    } catch {
      // Skip malformed messages silently
    }
  }

  return results;
}
