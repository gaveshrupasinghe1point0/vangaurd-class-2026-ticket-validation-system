// Read text off a photographed receipt using Google Gemini (vision).
// The transcribed text is then run through the same parser as PDFs,
// so NIC/amount detection rules stay identical for every receipt type.

// Primary model first, then lighter fallbacks if Google is overloaded (503/429)
const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
].filter((m, i, arr): m is string => !!m && arr.indexOf(m) === i);

const TOTAL_BUDGET_MS = 25_000; // stay under the route's 30s maxDuration
const RETRYABLE = new Set([429, 500, 503, 504]);

const PROMPT = `You are an OCR engine. Transcribe ALL text printed on this bank receipt / deposit slip / transfer screenshot exactly as it appears.
- Keep each label next to its value on the same line, e.g. "REFERENCE : 200715102440" or "Remarks ID. 200731904267".
- Copy every digit exactly. Do not guess, correct, summarise or translate.
- Output only the transcribed text, nothing else.`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Returns the receipt text, or null if OCR is not configured / fails. Never throws. */
export async function ocrReceiptImage(buffer: Buffer, mimeType: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set — skipping image OCR');
    return null;
  }

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType, data: buffer.toString('base64') } },
        ],
      },
    ],
    generationConfig: { temperature: 0 },
  });

  const deadline = Date.now() + TOTAL_BUDGET_MS;

  // Each model gets up to 2 tries; move to the next model when overloaded
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining < 2_000) {
        console.error('Gemini OCR: out of time budget');
        return null;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Math.min(remaining, 15_000));
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            signal: controller.signal,
            body,
          }
        );

        if (res.ok) {
          const json = await res.json();
          const text: string = (json.candidates?.[0]?.content?.parts ?? [])
            .map((p: { text?: string }) => p.text ?? '')
            .join('\n')
            .trim();
          if (text) return text;
          console.error(`Gemini OCR (${model}): empty response`);
          break; // try next model
        }

        const errText = await res.text();
        console.error(`Gemini OCR (${model}) failed: ${res.status} ${errText.slice(0, 200)}`);
        if (!RETRYABLE.has(res.status)) return null; // bad key / bad request — retrying won't help
        if (res.status === 404) break; // model name not available — next model
      } catch (e) {
        console.error(`Gemini OCR (${model}) error:`, e);
      } finally {
        clearTimeout(timeout);
      }

      await sleep(800 * (attempt + 1)); // short backoff before retrying
    }
  }

  return null;
}
