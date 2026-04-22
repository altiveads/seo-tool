import Anthropic from '@anthropic-ai/sdk';
import type {
  AuditContent,
  AdsContent,
  AuditInput,
  ScrapedSite,
} from './types';
import type { KeywordResearchResult } from './keywords';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY no está configurada. Agrega tu clave en .env.local.',
    );
  }
  return new Anthropic({ apiKey });
}

function extractJson(text: string): any {
  // Busca el primer bloque JSON válido en la respuesta
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No se encontró JSON en la respuesta de Claude.');
  }
  const json = candidate.slice(start, end + 1);
  return JSON.parse(json);
}

const AUDIT_SYSTEM = `Eres un consultor SEO senior con 20 años de experiencia en mercados hispanohablantes, especializado en salud, servicios profesionales y SEO local. Conoces a fondo los framework YMYL, E-E-A-T, SEO local (GBP), schema.org y las mejores prácticas técnicas 2026. Respondes siempre en español con tono profesional, concreto y accionable. Tus entregables se convierten directamente en PDFs para agencia y cliente.

REGLAS DE OUTPUT:
- Respondes ÚNICAMENTE con un objeto JSON válido (sin explicaciones, sin markdown, sin texto antes o después).
- Los volúmenes y dificultades son estimaciones cualitativas (low/medium/high).
- No inventas URLs, teléfonos ni datos del cliente: usa placeholders claros si faltan.
- Cumples políticas YMYL: nada de promesas médicas/legales/financieras absolutas.`;

const ADS_SYSTEM = `Eres un Google Ads Specialist senior con 15 años de experiencia, certificado oficial, experto en políticas de anuncios (incluidas salud, finanzas y legales), estructura de campañas avanzadas, Performance Max, pujas automáticas y medición con GA4.

REGLAS DE OUTPUT:
- Respondes ÚNICAMENTE con un objeto JSON válido.
- Cumples las políticas de Google Ads al pie de la letra. En salud: sin promesas absolutas, sin afirmaciones médicas no respaldadas, respetando las restricciones de remarketing personalizado.
- Los CPC y presupuestos están en COP (pesos colombianos) si la ciudad/país es Colombia.
- Las keywords de campañas están claramente etiquetadas por campaña (symptoms/services/brand).`;

function buildAuditUserPrompt(
  input: AuditInput,
  site: ScrapedSite,
  keywordSeeds?: KeywordResearchResult[],
): string {
  const kwText = keywordSeeds && keywordSeeds.length
    ? `\nSEMILLAS DE KEYWORDS EXPANDIDAS (Google autocomplete):\n${keywordSeeds
        .map((s) => `• Seed "${s.seed}": ${s.suggestions.slice(0, 30).join(', ')}`)
        .join('\n')}`
    : '';
  return `Genera una auditoría SEO completa para este negocio.

NEGOCIO:
- Cliente: ${input.clientName}
- URL: ${input.websiteUrl}
- Ciudad: ${input.city}
- País: ${input.country}
- Objetivos publicitarios declarados: ${input.objectives.join(', ')}${
    input.customObjective ? ` | Nota extra: ${input.customObjective}` : ''
  }
- Presupuesto mensual publicidad (COP): ${input.monthlyBudgetCOP ?? 'no especificado'}
- Competidores declarados: ${(input.competitors || []).join(', ') || 'ninguno (infiere 4-6 relevantes)'}

SITIO SCRAPEADO:
- Title: ${site.title || '(vacío)'}
- Meta description: ${site.metaDescription || '(vacía)'}
- H1: ${site.h1 || '(no detectado)'}
- H2s: ${site.h2s.slice(0, 12).join(' | ')}
- H3s: ${site.h3s.slice(0, 15).join(' | ')}
- CMS: ${site.cms || 'desconocido'}
- Schema JSON-LD: ${site.hasSchema ? 'presente' : 'ausente'}
- Open Graph: ${site.hasOpenGraph ? 'presente' : 'ausente'}
- Canonical: ${site.canonical || '(no detectado)'}
- Lang: ${site.lang || '(no declarado)'}
- Sitemap: ${site.sitemapStatus}
- Robots: ${site.robotsTxt ? 'accesible' : 'no accesible'}
- Redes sociales: ${Object.keys(site.social).join(', ') || 'ninguna'}
- Imágenes totales con alt vacío: ${site.images.filter((i) => !i.alt).length}/${site.images.length}
- URLs internas: ${site.internalLinks.join(', ')}
- Resumen del cuerpo (primeros 1200 car.): ${site.bodyText.slice(0, 1200)}
${kwText}

Devuelve EXACTAMENTE este JSON (español, completo, accionable):

{
  "meta": { "url": "...", "clientName": "...", "city": "...", "country": "...", "generatedAt": "ISO-date" },
  "executiveSummary": "párrafo de 4-6 frases con diagnóstico global y mayor oportunidad",
  "topPriorities": [
    { "rank": 1, "title": "...", "impact": "ALTO|MEDIO|BAJO", "effort": "ALTO|MEDIO|BAJO", "window": "7 días|30 días|60 días|90 días" }
  ],
  "onPageIssues": [ { "element": "Title tag", "current": "...", "problem": "...", "severity": "CRÍTICO|ALTO|MEDIO|BAJO|OK", "fix": "..." } ],
  "technicalAudit": [ { "check": "Sitemap XML", "status": "OK|WARN|FAIL", "detail": "..." } ],
  "competitors": [ { "name": "...", "strength": "...", "weakness": "...", "threat": "Alta|Media|Baja" } ],
  "contentGaps": [ { "url": "/servicios/...", "type": "Landing|Blog|FAQ", "keyword": "...", "priority": "P1|P2|P3" } ],
  "keywordOpportunities": {
    "transactional": [ { "keyword": "...", "intent": "transactional", "difficulty": "low|medium|high", "volume": "low|medium|high|very_high" } ],
    "symptoms": [ { "keyword": "...", "intent": "informational", "difficulty": "low|medium|high", "volume": "low|medium|high|very_high" } ],
    "brand": [ { "keyword": "...", "intent": "brand", "difficulty": "low|medium|high", "volume": "low|medium|high" } ]
  },
  "localSeoChecklist": [ { "item": "...", "action": "..." } ],
  "eeatChecklist": [ "punto 1", "..." ],
  "actionPlan": {
    "quickWins": [ { "action": "...", "impact": "Alto|Medio|Bajo", "effort": "Alto|Medio|Bajo" } ],
    "strategic": [ { "action": "...", "impact": "Alto|Medio|Bajo", "effort": "Alto|Medio|Bajo" } ]
  },
  "kpis": [ { "kpi": "...", "baseline": "...", "m3": "...", "m6": "..." } ],
  "roadmap": [ { "month": "Mes 1", "focus": "...", "deliverable": "..." } ],
  "clientFriendly": {
    "whatsGood": [ "..." ],
    "whatsMissing": [ "..." ],
    "opportunities": [ { "title": "...", "why": "..." } ],
    "plan6Months": [ { "month": "Mes 1", "work": "...", "gain": "..." } ],
    "expectedResults": [ { "indicator": "...", "now": "...", "m3": "...", "m6": "..." } ]
  }
}

Mínimos: 5 topPriorities · 10 onPageIssues · 12 technicalAudit · 4 competitors · 10 contentGaps · 12 keywords por grupo · 10 localSeoChecklist · 8 eeatChecklist · 8 quickWins · 8 strategic · 8 kpis · 6 roadmap · 5 whatsGood · 6 whatsMissing · 6 opportunities · 6 plan6Months · 5 expectedResults.`;
}

function buildAdsUserPrompt(input: AuditInput, audit: AuditContent): string {
  const kwNote = input.includeKeywordsInStrategyPdf
    ? 'El PDF de Ads DEBE incluir las keywords completas de cada campaña.'
    : 'El PDF de Ads debe incluir solo ejemplos, no la lista completa.';

  return `Genera la estrategia de Google Ads para este cliente, alineada a la auditoría SEO recién creada.

CONTEXTO:
- Cliente: ${input.clientName}
- Ciudad: ${input.city}, ${input.country}
- Presupuesto mensual (COP): ${input.monthlyBudgetCOP ?? 'no especificado — propón 3 escenarios'}
- Objetivos: ${input.objectives.join(', ')}${input.customObjective ? ' | ' + input.customObjective : ''}
- Keywords relevantes ya identificadas en auditoría: transactional=${audit.keywordOpportunities.transactional
    .slice(0, 10)
    .map((k) => k.keyword)
    .join(', ')} | symptoms=${audit.keywordOpportunities.symptoms
    .slice(0, 10)
    .map((k) => k.keyword)
    .join(', ')}
- Competidores: ${audit.competitors.map((c) => c.name).join(', ')}

REQUISITOS CLAVE:
- 3 campañas: (1) Síntomas, (2) Servicios, (3) Marca.
- Cada campaña debe tener grupos de anuncios, keywords por grupo, ad copy RSA (15 titulares, 4 descripciones), landing recomendada y extensiones.
- ${kwNote}
- Incluir políticas de Google Ads aplicables al rubro.
- Incluir 3 escenarios de presupuesto (bajo / medio / alto).
- Cumplir todas las restricciones de políticas de salud/finanzas si aplica.

Devuelve EXACTAMENTE este JSON:

{
  "meta": { "clientName": "...", "city": "...", "monthlyBudgetCOP": 6000000, "generatedAt": "ISO" },
  "thesis": "2-4 frases",
  "policies": [ { "policy": "...", "application": "..." } ],
  "campaigns": [
    {
      "id": "symptoms",
      "name": "C1 – Síntomas",
      "intent": "Informacional / descubrimiento",
      "volumeTarget": "Alto (40%)",
      "cpcRange": "$600 – $2.800 COP",
      "adGroups": [
        { "name": "SINTOMAS_X", "keywords": ["..."], "landing": "/..." }
      ],
      "adCopy": {
        "headlines": [ "15 titulares, máx 30 car cada uno" ],
        "descriptions": [ "4 descripciones, máx 90 car" ]
      },
      "extensions": [ "Sitelink ...", "Fragmento ..." ]
    }
  ],
  "budgetScenarios": [
    { "name": "Bajo", "total": "$3.000.000 COP", "c1": "...", "c2": "...", "c3": "...", "clicksEstimate": "2.200–2.800" }
  ],
  "targeting": {
    "locations": [ "..." ],
    "devices": "descripción",
    "schedule": "descripción",
    "audiences": [ "..." ]
  },
  "measurement": {
    "events": [ { "event": "click_whatsapp", "category": "Primary", "trigger": "click en botón WhatsApp" } ],
    "stack": [ "GA4", "GTM", "..." ]
  },
  "negatives": {
    "global": [ "..." ],
    "byCampaign": [ { "campaign": "C1", "items": ["..."] } ]
  },
  "clientFriendly": {
    "theIdea": "párrafo",
    "campaignsExplained": [ { "name": "Síntomas", "explanation": "..." } ],
    "whereYouAppear": [ { "location": "Primer resultado de Google", "userSees": "..." } ],
    "expectedResults": [ { "scenario": "Arranque", "investment": "$3.000.000 COP", "monthlyVisits": "...", "dailyVisits": "...", "costPerVisit": "..." } ],
    "whatWeNeedFromYou": [ "..." ],
    "ourPromise": [ "..." ]
  }
}

Mínimos: 8 policies · 3 campaigns (cada una con mín. 6 adGroups × 8-14 keywords) · 3 budgetScenarios · 6 locations · 6 audiences · 8 events · 8 negatives globales · 5 campaignsExplained · 5 whereYouAppear · 3 expectedResults · 5 whatWeNeedFromYou · 5 ourPromise.`;
}

export async function generateAuditContent(
  input: AuditInput,
  site: ScrapedSite,
  keywordSeeds?: KeywordResearchResult[],
): Promise<AuditContent> {
  const client = getClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: AUDIT_SYSTEM,
    messages: [{ role: 'user', content: buildAuditUserPrompt(input, site, keywordSeeds) }],
  });
  const text = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n');
  const parsed = extractJson(text) as AuditContent;
  parsed.meta = parsed.meta || ({} as AuditContent['meta']);
  parsed.meta.generatedAt = new Date().toISOString();
  return parsed;
}

export async function generateAdsContent(
  input: AuditInput,
  audit: AuditContent,
): Promise<AdsContent> {
  const client = getClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: ADS_SYSTEM,
    messages: [{ role: 'user', content: buildAdsUserPrompt(input, audit) }],
  });
  const text = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n');
  const parsed = extractJson(text) as AdsContent;
  parsed.meta = parsed.meta || ({} as AdsContent['meta']);
  parsed.meta.generatedAt = new Date().toISOString();
  return parsed;
}
