import { extractText } from "unpdf";

const MAX_LEASE_CHARS = 60_000; // keeps the Gemini prompt/cost bounded

export async function extractLeaseText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  let text: string;

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const result = await extractText(buffer, { mergePages: true });
    text = result.text;
  } else {
    text = await file.text();
  }

  text = text.trim();
  if (!text) {
    throw new Error(
      "No text could be read from this file. If it's a scanned/image-only PDF, try a text-based lease file instead.",
    );
  }

  return text.slice(0, MAX_LEASE_CHARS);
}
