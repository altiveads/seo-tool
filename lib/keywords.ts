/**
 * Expansión gratuita de keywords usando Google Autocomplete + People Also Ask.
 * No requiere API pagada. Devuelve semillas ampliadas para que Claude clasifique.
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

async function autocomplete(query: string, gl = 'co', hl = 'es'): Promise<string[]> {
  // Endpoint no oficial pero estable. Devuelve JSON con sugerencias.
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&gl=${gl}&hl=${hl}&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.[1]) ? (data[1] as string[]) : [];
  } catch {
    return [];
  }
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

/** Genera variantes alfabéticas: "{seed} a", "{seed} b", etc. para cosechar mas long-tail. */
async function alphabeticalExpand(seed: string): Promise<string[]> {
  const tasks = ALPHA.split('').map((letter) =>
    autocomplete(`${seed} ${letter}`).catch(() => [] as string[]),
  );
  const all = (await Promise.all(tasks)).flat();
  return Array.from(new Set(all));
}

export interface KeywordResearchResult {
  seed: string;
  suggestions: string[];
  total: number;
}

export async function expandKeywords(
  seeds: string[],
  opts: { deep?: boolean } = {},
): Promise<KeywordResearchResult[]> {
  const results: KeywordResearchResult[] = [];
  for (const seed of seeds) {
    const base = await autocomplete(seed);
    const extra = opts.deep ? await alphabeticalExpand(seed) : [];
    const merged = Array.from(new Set([...base, ...extra])).slice(0, 120);
    results.push({ seed, suggestions: merged, total: merged.length });
  }
  return results;
}

/** Genera semillas relevantes según el nicho del cliente + ciudad. */
export function defaultSeeds(opts: {
  clientName: string;
  city: string;
  services?: string[];
}): string[] {
  const { clientName, city, services = [] } = opts;
  const c = city.toLowerCase();
  const seeds = new Set<string>([
    clientName.toLowerCase(),
    `${clientName.toLowerCase()} ${c}`,
    `${clientName.toLowerCase()} opiniones`,
    `mejor ${services[0] || 'servicio'} ${c}`,
    `${services[0] || 'servicio'} ${c}`,
    `${services[0] || 'servicio'} precio ${c}`,
  ]);
  services.forEach((s) => {
    if (!s) return;
    seeds.add(`${s} ${c}`);
    seeds.add(`${s} precio ${c}`);
    seeds.add(`${s} cerca de mi`);
  });
  return Array.from(seeds).filter(Boolean).slice(0, 10);
}
