export function parseArrayResponse(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;

  if (typeof input === "string") {
    const parsed = JSON.parse(input) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Ожидался JSON-массив в строке");
    return parsed;
  }

  if (Buffer.isBuffer(input)) {
    const parsed = JSON.parse(input.toString("utf8")) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Ожидался JSON-массив в Buffer");
    return parsed;
  }

  if (input instanceof Uint8Array) {
    const parsed = JSON.parse(Buffer.from(input).toString("utf8")) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Ожидался JSON-массив в Uint8Array");
    return parsed;
  }

  throw new Error("Неожиданный тип response");
}

export function hasStopWordInRemarks(items: unknown[], stopWords: string[]): boolean {
  const stops = stopWords.map(s => s.toLowerCase());

  for (const it of items) {
    if (typeof it !== "object" || it === null || Array.isArray(it)) continue;

    const remarks = (it as Record<string, unknown>)["remarks"];
    if (typeof remarks !== "string") continue;

    const r = remarks.toLowerCase();
    if (stops.some(sw => r.includes(sw))) return true;
  }

  return false;
}

