// Read text off a photographed receipt using Google Gemini (vision).
// The transcribed text is then run through the same parser as PDFs,
// so NIC/amount detection rules stay identical for every receipt type.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const PROMPT = `You are an OCR engine. Transcribe ALL text printed on this bank receipt / deposit slip / transfer screenshot exactly as it appears.
- Keep each label next to its value on the same line, e.g. "REFERENCE : 200715102440" or "Remarks ID. 200731904267".
- Copy every digit exactly. Do not guess, correct, summarise or translate.
- Output only the transcribed text, nothing else.`;

/** Returns the receipt text, or null if OCR is not configured / fails. Never throws. */
export async function ocrReceiptImage(buffer: Buffer, mimeType: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set — skipping image OCR');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                { inline_data: { mime_type: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType, data: buffer.toString('base64') } },
              ],
            },
          ],
          generationConfig: { temperature: 0 },
        }),
      }
    );

    if (!res.ok) {
      console.error('Gemini OCR failed:', res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const text: string = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? '')
      .join('\n')
      .trim();
    return text || null;
  } catch (e) {
    console.error('Gemini OCR error:', e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
