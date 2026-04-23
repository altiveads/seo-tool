import Anthropic from '@anthropic-ai/sdk';
import type { AuditInput, ScrapedSite } from './types';
import type { KeywordResearchResult } from './keywords';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurada en .env.local.');
  return new Anthropic({ apiKey });
}

function extractJson(text: string): any {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No se encontró JSON en la respuesta de Claude.');
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callClaude(system: string, userPrompt: string, maxTokens = 8000): Promise<any> {
  const client = getClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  });
  if (msg.stop_reason === 'max_tokens') {
    throw new Error(`Respuesta truncada (max_tokens=${maxTokens}). Reduce el contenido solicitado.`);
  }
  const text = msg.content
    .filter(b => b.type === 'text')
    .map(b => (b as any).text)
    .join('\n');
  return extractJson(text);
}

// ─────────────────────────────────────────────────────────
// SISTEMA base
// ─────────────────────────────────────────────────────────
const SYSTEM_AUDIT = `Eres un consultor SEO senior con 20 años de experiencia en mercados hispanohablantes, especializado en salud y SEO local. Trabajas para la agencia Altive.

REGLAS ABSOLUTAS:
- Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después.
- Español colombiano profesional.
- HTML permitido solo en strings: <b>negrita</b> <i>cursiva</i>
- LÍMITES DE LONGITUD ESTRICTOS:
  * Campos "paragraphs": cada string máximo 30 palabras
  * Campos "current", "element", "check": máximo 10 palabras
  * Campos "problem", "detail", "action": máximo 12 palabras
  * Campos "keyword", "title" en listas: máximo 6 palabras
  * Campos "callout": máximo 20 palabras
  * Campos "closing", "thesis": máximo 25 palabras
- Personaliza con el nombre del cliente, ciudad y servicios detectados.
- No inventes datos: usa lo scrapeado o escribe "(verificar)".
- Políticas YMYL: sin promesas médicas absolutas.`;

const SYSTEM_ADS = `Eres un Google Ads Specialist senior certificado. Trabajas para la agencia Altive.

REGLAS ABSOLUTAS:
- Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después.
- Español colombiano profesional.
- HTML permitido solo en strings: <b>negrita</b> <i>cursiva</i>
- LÍMITES DE LONGITUD ESTRICTOS:
  * Headlines: máximo 30 caracteres cada uno (obligatorio para Google Ads)
  * Descriptions: máximo 90 caracteres cada uno (obligatorio para Google Ads)
  * Campos "policy", "application", "explanation": máximo 20 palabras
  * Campos "thesis", "theIdea", "closing": máximo 30 palabras
  * Campos "trigger", "devices", "schedule": máximo 15 palabras
- Cumple políticas Google Ads: sin promesas absolutas.
- Presupuestos en COP para clientes colombianos.`;

// ─────────────────────────────────────────────────────────
// AUDIT — Call 1/3: datos técnicos (keywords, on-page, técnica)
// ─────────────────────────────────────────────────────────
function buildAuditDataPrompt(
  input: AuditInput,
  site: ScrapedSite,
  seeds?: KeywordResearchResult[],
): string {
  const kwText = seeds?.length
    ? `\nKEYWORDS (autocomplete):\n${seeds.map(s =>
        `• "${s.seed}": ${s.suggestions.slice(0, 15).join(', ')}`).join('\n')}`
    : '';

  return `Analiza el sitio de ${input.clientName} y genera SOLO la sección de datos técnicos (keywords, on-page, técnica).

CLIENTE: ${input.clientName} | ${input.websiteUrl} | ${input.city}, ${input.country}

SITIO:
- Title: ${site.title || '(vacío)'}
- Meta: ${site.metaDescription || '(vacía)'}
- H1: ${site.h1 || '(no)'}
- H2s: ${site.h2s.slice(0, 10).join(' | ')}
- CMS: ${site.cms || '?'} | Schema: ${site.hasSchema ? 'sí' : 'no'} | OG: ${site.hasOpenGraph ? 'sí' : 'no'}
- Sitemap: ${site.sitemapStatus} | Lang: ${site.lang || 'no'} | Canonical: ${site.canonical || 'no'}
- Redes: ${Object.keys(site.social).join(', ') || 'ninguna'}
- Imgs sin alt: ${site.images.filter(i => !i.alt).length}/${site.images.length}
- Texto: ${site.bodyText.slice(0, 1500)}
${kwText}

Devuelve EXACTAMENTE este JSON:

{
  "keywords": {
    "paragraphs": ["análisis conciso de la oportunidad de palabras clave para ${input.clientName} en ${input.city}..."],
    "transactional": [
      {"keyword": "...", "intent": "Transaccional", "difficulty": "Alta|Media|Baja", "volume": "Muy alto|Alto|Medio|Bajo", "priority": "P1|P2|P3"}
    ],
    "symptoms": [
      {"keyword": "...", "intent": "Informacional", "difficulty": "Baja", "volume": "Alto"}
    ],
    "brand": [
      {"keyword": "...", "objective": "..."}
    ],
    "callout": "<b>Oportunidad clave.</b> texto específico sobre el nicho..."
  },
  "onPage": {
    "items": [
      {"element": "Title tag", "current": "texto actual o '(vacío)'", "problem": "descripción del problema", "severity": "CRÍTICO|ALTO|MEDIO|BAJO|OK"}
    ],
    "templates": [
      {"label": "Title tag home", "value": "ejemplo de title optimizado para ${input.clientName} ${input.city}"}
    ]
  },
  "technical": [
    {"check": "nombre del check", "status": "OK|WARN|FAIL", "detail": "descripción concisa"}
  ],
  "technicalCallout": "<b>Prioridad técnica #1.</b> descripción del problema más urgente..."
}

MÍNIMOS (si no hay datos reales, dedúcelos del sector ${input.clientName}):
- keywords.transactional: 8 items
- keywords.symptoms: 8 items
- keywords.brand: 4 items
- onPage.items: 10 items (Title, Meta, H1, H2s, imágenes alt, Schema, OG, Canonical, Lang, URLs amigables)
- technical: 10 items (HTTPS, velocidad, mobile, sitemap, robots.txt, indexación, CMS, redirects, Core Web Vitals, seguridad)`;
}

// ─────────────────────────────────────────────────────────
// AUDIT — Call 2/3: análisis cualitativo y plan
// ─────────────────────────────────────────────────────────
function buildAuditPlanPrompt(
  input: AuditInput,
  site: ScrapedSite,
  dataSection: any,
): string {
  const topKws = dataSection?.keywords?.transactional?.slice(0, 6).map((k: any) => k.keyword).join(', ') || '';
  const criticals = dataSection?.onPage?.items?.filter((i: any) => i.severity === 'CRÍTICO').map((i: any) => i.element).join(', ') || '';

  return `Genera el análisis estratégico y plan de acción SEO para ${input.clientName}.

CLIENTE: ${input.clientName} | ${input.websiteUrl} | ${input.city}, ${input.country}
COMPETIDORES CONOCIDOS: ${(input.competitors || []).join(', ') || 'detectar del sector'}
HALLAZGOS TÉCNICOS YA ANALIZADOS:
- Keywords transaccionales top: ${topKws}
- Problemas críticos on-page: ${criticals || 'varios'}
- Sitio: Title="${site.title || '(vacío)'}" | CMS=${site.cms || '?'} | Schema=${site.hasSchema}
- Cuerpo web: ${site.bodyText.slice(0, 800)}

Devuelve EXACTAMENTE este JSON:

{
  "index": ["1. Resumen Ejecutivo", "2. Metodología y Alcance", "3. Contexto y Competencia", "4. Investigación de Palabras Clave", "5. Auditoría On-Page", "6. Auditoría Técnica", "7. Contenido y Brechas", "8. SEO Local", "9. E-E-A-T y Autoridad", "10. Benchmark", "11. Plan de Acción", "12. KPIs y Roadmap", "13. Anexos"],
  "executiveSummary": {
    "paragraphs": ["diagnóstico técnico directo: estado actual y la oportunidad principal...", "segundo párrafo sobre urgencia y qué se gana actuando rápido..."],
    "diagnosis": "etiqueta diagnóstica en MAYÚSCULAS (ej: FUNDACIÓN DÉBIL — REQUIERE INTERVENCIÓN INMEDIATA)",
    "priorities": [
      {"rank": 1, "title": "acción concreta", "impact": "ALTO|MUY ALTO|MEDIO", "effort": "Bajo|Medio|Alto", "window": "7 días|1 mes|3 meses"}
    ],
    "callout": "<b>Oportunidad estratégica.</b> texto específico de la oportunidad principal para ${input.clientName}..."
  },
  "methodology": {
    "paragraphs": ["descripción del enfoque metodológico..."],
    "tools": ["Inspección HTML de ${input.websiteUrl}", "Análisis SERP local ${input.city}", "Google autocomplete y sugerencias", "Revisión robots.txt y sitemap.xml", "Inspección visual del sitio"]
  },
  "context": {
    "paragraphs": ["descripción del negocio de ${input.clientName}: servicios, ubicación, público objetivo..."],
    "competitors": [
      {"name": "nombre del competidor", "strength": "su punto fuerte en Google", "weakness": "su punto débil", "threat": "Alta|Media|Baja"}
    ],
    "callout": "<b>Lectura estratégica.</b> el diferencial de ${input.clientName} vs la competencia..."
  },
  "contentGap": {
    "paragraphs": ["qué páginas le faltan al sitio para capturar demanda local..."],
    "items": [
      {"url": "/url-sugerida", "type": "Landing|Blog|FAQ|Servicio", "keyword": "keyword objetivo", "priority": "P1|P2|P3"}
    ],
    "clusters": ["<b>Cluster 1 — nombre:</b> descripción del tema y páginas necesarias..."]
  },
  "localSeo": {
    "paragraphs": ["análisis del estado de SEO local de ${input.clientName} en ${input.city}..."],
    "items": [
      {"item": "elemento de SEO local", "action": "acción concreta a tomar"}
    ],
    "callout": "<b>Prioridad local.</b> el paso más importante de SEO local para ${input.clientName}..."
  },
  "eeat": {
    "paragraphs": ["relevancia del E-E-A-T para el sector de ${input.clientName}..."],
    "checklist": ["elemento de E-E-A-T a implementar..."],
    "linkBuilding": [
      {"lever": "fuente de enlaces", "objective": "qué se logra", "priority": "P1|P2|P3"}
    ]
  },
  "benchmark": {
    "headers": ["Dimensión", "${input.clientName}", "Competidor A", "Competidor B", "Líder"],
    "rows": [["páginas indexables", "~5", "~80", "~50", "Competidor A"]],
    "colWidths": [3.7, 2.5, 2.3, 2.5, 2.5],
    "callout": "<b>Brecha principal.</b> lo que más separa a ${input.clientName} de los líderes..."
  },
  "actionPlan": {
    "quickWins": [
      {"action": "acción concreta (imperativo)", "impact": "Alto|Muy alto|Medio", "effort": "Bajo|Medio"}
    ],
    "strategic": [
      {"action": "acción estratégica a mediano plazo", "impact": "Muy alto", "effort": "Alto|Medio"}
    ]
  },
  "kpis": [
    {"kpi": "nombre del KPI", "baseline": "valor actual", "m3": "meta mes 3", "m6": "meta mes 6"}
  ],
  "roadmap": [
    {"month": "Mes 1", "focus": "tema principal del mes", "deliverable": "entregable concreto"}
  ],
  "stack": ["<b>Analítica:</b> GA4, GSC, Looker Studio", "<b>Optimización:</b> herramienta/plugin CMS", "<b>Local:</b> Google Business Profile"],
  "annexes": {
    "ymyl": ["directriz YMYL aplicable al sector...", "..."],
    "risks": [
      {"risk": "riesgo identificado", "mitigation": "cómo mitigarlo"}
    ],
    "nextSteps": ["primer paso concreto tras aprobar este plan...", "..."],
    "closing": "<b>Cierre.</b> texto motivador personalizado para ${input.clientName} con la visión a 6 meses..."
  }
}

MÍNIMOS:
- executiveSummary.priorities: 5
- context.competitors: 5
- contentGap.items: 8
- contentGap.clusters: 3
- localSeo.items: 8
- eeat.checklist: 6
- eeat.linkBuilding: 5
- benchmark.rows: 6
- actionPlan.quickWins: 7
- actionPlan.strategic: 6
- kpis: 6
- roadmap: 6 meses exactos`;
}

// ─────────────────────────────────────────────────────────
// AUDIT — Call 3/3: sección CLIENTE (narrativo, simple)
// ─────────────────────────────────────────────────────────
function buildAuditClientPrompt(
  input: AuditInput,
  site: ScrapedSite,
  agencyData: { data: any; plan: any },
): string {
  const competitors = agencyData.plan?.context?.competitors?.slice(0, 4).map((c: any) => c.name).join(', ') || '';
  const quickWins = agencyData.plan?.actionPlan?.quickWins?.slice(0, 4).map((q: any) => q.action).join('; ') || '';

  return `Genera el informe CLIENTE de la auditoría SEO para ${input.clientName}. Tono: humano, diagnóstico, como si se lo explicaras al empresario en una reunión. Sin tecnicismos.

CLIENTE: ${input.clientName} | ${input.city}, ${input.country}
SITIO: ${site.title || '(sin title)'} | H1: ${site.h1 || '(vacío)'} | H2s: ${site.h2s.slice(0, 5).join(', ')}
COMPETIDORES: ${competitors}
QUICK WINS DEL ANÁLISIS: ${quickWins}
DIAGNÓSTICO TÉCNICO: ${agencyData.plan?.executiveSummary?.diagnosis || 'presencia digital débil'}

Devuelve EXACTAMENTE este JSON:

{
  "client": {
    "cover": {
      "title": "Tu presencia en Google hoy",
      "subtitle": "Diagnóstico sencillo y plan de mejora",
      "tagline": "Un documento pensado para ti, sin tecnicismos."
    },
    "intro": {
      "title": "¿Para qué sirve este documento?",
      "paragraphs": ["párrafo 1: contexto de ${input.clientName} en el mundo digital hoy...", "párrafo 2: para qué le sirve este diagnóstico específicamente..."],
      "callout": "<b>La idea en una frase.</b> fortaleza específica de ${input.clientName} + qué le falta en digital..."
    },
    "seoSection": {
      "title": "¿Qué es SEO, explicado fácil?",
      "paragraphs": ["cuando alguien en ${input.city} busca [servicio del cliente], aparecer primero significa..."],
      "benefits": ["te encuentran sin pagar por cada clic.", "más personas conocen tu nombre antes de llamar.", "cada mes que pasa, el efecto se acumula más.", "compites de igual a igual con clínicas más grandes."]
    },
    "diagnosis": {
      "title": "Cómo está tu página web hoy",
      "intro": "frase introductoria específica sobre el estado actual de ${input.clientName}...",
      "goodTitle": "Lo que está bien",
      "good": ["<b>punto positivo específico del sitio</b>: explicación simple de por qué importa...", "..."],
      "missingTitle": "Lo que le hace falta",
      "missing": ["<b>problema concreto detectado</b>: qué significa para el negocio en lenguaje simple...", "..."],
      "callout": "<b>Cómo lo resumimos.</b> analogía memorable personalizada para el tipo de negocio de ${input.clientName}..."
    },
    "competitors": {
      "title": "¿Contra quién compites en Google?",
      "intro": "descripción de la competencia en ${input.city} para el sector de ${input.clientName}...",
      "rows": [{"name": "nombre del competidor", "strength": "por qué le va bien en Google"}],
      "callout": "<b>Buena noticia.</b> el diferencial o ventaja específica de ${input.clientName}..."
    },
    "opportunities": {
      "title": "Las oportunidades más grandes",
      "intro": "las jugadas más impactantes, de la más urgente a la más estratégica:",
      "items": [
        {"title": "nombre de la oportunidad", "why": "qué impacto real tiene para el negocio, en términos de pacientes/clientes, no de SEO..."}
      ]
    },
    "plan": {
      "title": "Qué vamos a hacer (plan de 6 meses)",
      "intro": "trabajamos por etapas para que cada mes veas avances concretos:",
      "rows": [
        {"month": "Mes 1", "work": "qué hace Altive este mes...", "gain": "qué gana ${input.clientName}..."}
      ]
    },
    "results": {
      "title": "¿Qué vas a ver en resultados?",
      "intro": "estimados realistas para ${input.city} y el sector de ${input.clientName}...",
      "rows": [{"kpi": "nombre del resultado", "now": "estado actual", "m3": "meta mes 3", "m6": "meta mes 6"}],
      "callout": "<b>Importante.</b> el SEO es una inversión que se acumula, no un gasto mensual que desaparece..."
    },
    "needs": {
      "title": "Lo único que necesitamos de ti",
      "items": ["<b>Accesos al sitio web</b>: usuario administrador del CMS.", "..."]
    },
    "closing": {
      "title": "¿Empezamos?",
      "paragraphs": ["síntesis de las fortalezas de ${input.clientName} y la oportunidad digital detectada...", "mensaje motivador sobre el crecimiento que viene..."],
      "callout": "<b>Próximo paso.</b> acción concreta e inmediata para empezar..."
    }
  }
}

MÍNIMOS:
- diagnosis.good: 5 puntos (específicos del sitio real)
- diagnosis.missing: 6 puntos (lenguaje simple, con impacto en negocio)
- competitors.rows: 5
- opportunities.items: 6
- plan.rows: 6 meses exactos
- results.rows: 5
- needs.items: 5`;
}

// ─────────────────────────────────────────────────────────
// ADS — Call 1/2: sección AGENCIA (técnica)
// ─────────────────────────────────────────────────────────
function buildAdsAgencyPrompt(input: AuditInput, auditJson: any): string {
  const competitors = auditJson?.agency?.context?.competitors?.slice(0, 5).map((c: any) => c.name).join(', ') || '';
  const kwTx = auditJson?.agency?.keywords?.transactional?.slice(0, 6).map((k: any) => k.keyword).join(', ') || '';
  const kwSy = auditJson?.agency?.keywords?.symptoms?.slice(0, 6).map((k: any) => k.keyword).join(', ') || '';

  return `Genera la estrategia AGENCIA de Google Ads para ${input.clientName}.

CLIENTE: ${input.clientName} | ${input.city}, ${input.country}
PRESUPUESTO: ${input.monthlyBudgetCOP ? `$${input.monthlyBudgetCOP.toLocaleString()} COP/mes` : 'no especificado — propón 3 escenarios'}
OBJETIVOS: ${input.objectives.join(', ')}${input.customObjective ? ' | ' + input.customObjective : ''}
COMPETIDORES: ${competitors}
KEYWORDS TRANSACCIONALES: ${kwTx}
KEYWORDS SÍNTOMAS: ${kwSy}

OBJETIVO: máximo tráfico al sitio. 3 CAMPAÑAS: C1 Síntomas · C2 Servicios · C3 Marca.

Devuelve EXACTAMENTE este JSON (solo la clave "agency"):

{
  "agency": {
    "thesis": "tesis estratégica técnica: por qué esta estructura de 3 campañas es óptima para ${input.clientName}...",
    "policies": [
      {"policy": "nombre de política Google Ads", "application": "cómo aplica específicamente a ${input.clientName}"}
    ],
    "campaigns": [
      {
        "id": "symptoms",
        "name": "C1 – Síntomas / Descubrimiento",
        "intent": "Informacional",
        "volumeTarget": "Alto (40% presupuesto)",
        "cpcRange": "$X.000 – $Y.000 COP",
        "adGroups": [
          {
            "name": "NOMBRE_GRUPO_ANUNCIOS",
            "keywords": ["keyword exacta 1", "keyword exacta 2", "keyword exacta 3", "keyword exacta 4", "keyword exacta 5"],
            "landing": "/url-de-destino"
          }
        ],
        "adCopy": {
          "headlines": ["T1: máx 30 car", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12", "T13", "T14", "T15"],
          "descriptions": ["D1: máx 90 car — descripción completa orientada al usuario que busca síntomas", "D2", "D3", "D4"]
        },
        "extensions": ["Sitelink: nombre → /url", "Fragmento estructurado: categoría — item1, item2", "Llamada: +57 XXX", "Extracto: texto beneficio"]
      },
      {
        "id": "services",
        "name": "C2 – Servicios / Comercial",
        "intent": "Comercial / Transaccional",
        "volumeTarget": "Medio-Alto (40% presupuesto)",
        "cpcRange": "$X.000 – $Y.000 COP",
        "adGroups": [],
        "adCopy": {"headlines": [], "descriptions": []},
        "extensions": []
      },
      {
        "id": "brand",
        "name": "C3 – Marca / Defensa",
        "intent": "Navegacional",
        "volumeTarget": "Bajo (20% presupuesto)",
        "cpcRange": "$X.000 – $Y.000 COP",
        "adGroups": [],
        "adCopy": {"headlines": [], "descriptions": []},
        "extensions": []
      }
    ],
    "budgetScenarios": [
      {"name": "Arranque",    "total": "$X COP/mes", "c1": "$X", "c2": "$X", "c3": "$X", "clicksEstimate": "X–X clics/mes"},
      {"name": "Crecimiento", "total": "$X COP/mes", "c1": "$X", "c2": "$X", "c3": "$X", "clicksEstimate": "X–X clics/mes"},
      {"name": "Escala",      "total": "$X COP/mes", "c1": "$X", "c2": "$X", "c3": "$X", "clicksEstimate": "X–X clics/mes"}
    ],
    "targeting": {
      "locations": ["${input.city}", "municipios aledaños relevantes"],
      "devices": "estrategia por dispositivo: mobile-first con bid adjustment...",
      "schedule": "horario: lunes–viernes, franjas de mayor búsqueda...",
      "audiences": ["Visitantes previos al sitio (RLSA)", "Audiencias similares", "Remarketing"]
    },
    "measurement": {
      "events": [
        {"event": "nombre_evento_ga4", "category": "Primary|Secondary", "trigger": "cómo se dispara / cómo medirlo en GTM"}
      ],
      "stack": ["GA4", "Google Tag Manager", "Google Ads Conversion Tag", "Google Business Profile"]
    },
    "negatives": {
      "global": ["gratis", "gratuito", "casero", "youtube", "video", "empleo", "trabajo", "curriculum", "curso", "diplomado"],
      "byCampaign": [
        {"campaign": "C1 Síntomas", "items": ["precio", "costo", "cuánto vale", "cirugía", "operación"]},
        {"campaign": "C2 Servicios", "items": ["síntoma", "qué es", "causas", "por qué", "cómo saber"]},
        {"campaign": "C3 Marca",    "items": ["nombres de competidores principales"]}
      ]
    }
  }
}

MÍNIMOS:
- policies: 6
- C1: 4 adGroups × 5 keywords + 15 headlines + 4 descriptions + 4 extensions
- C2: 4 adGroups × 5 keywords + 15 headlines + 4 descriptions + 4 extensions
- C3: 2 adGroups × 4 keywords + 10 headlines + 2 descriptions + 2 extensions
- budgetScenarios: exactamente 3
- measurement.events: 6
- negatives.global: 15`;
}

// ─────────────────────────────────────────────────────────
// ADS — Call 2/2: sección CLIENTE (simple)
// ─────────────────────────────────────────────────────────
function buildAdsClientPrompt(input: AuditInput, agencyAdsData: any): string {
  const scenarios = agencyAdsData?.budgetScenarios?.map((b: any) =>
    `${b.name}: ${b.total} → ${b.clicksEstimate}`).join(' | ') || '';

  return `Genera el informe CLIENTE de Google Ads para ${input.clientName}. Tono: simple, aliado, sin jerga técnica.

CLIENTE: ${input.clientName} | ${input.city}
ESCENARIOS: ${scenarios}

Devuelve EXACTAMENTE este JSON (solo la clave "client"):

{
  "client": {
    "cover": {
      "title": "Cómo vamos a aparecer en Google",
      "subtitle": "${input.clientName} — Plan de Publicidad Digital"
    },
    "theIdea": "3-4 oraciones en lenguaje de negocio explicando la estrategia para ${input.clientName} en ${input.city}, sin jerga...",
    "whereYouAppear": [
      {"location": "descripción del lugar de aparición", "userSees": "qué ve exactamente la persona que busca, con ejemplo realista de ${input.city}..."}
    ],
    "campaignsExplained": [
      {
        "name": "Campaña 1: Síntomas",
        "explanation": "qué hace esta campaña y qué tipo de persona la ve, en lenguaje de ${input.clientName}..."
      },
      {"name": "Campaña 2: Servicios",  "explanation": "..."},
      {"name": "Campaña 3: Tu Marca",   "explanation": "..."}
    ],
    "expectedResults": [
      {"scenario": "Arranque",    "investment": "$X COP/mes", "monthlyVisits": "X–X visitas", "dailyVisits": "X–X/día", "costPerVisit": "$X–$Y COP"},
      {"scenario": "Crecimiento", "investment": "$X COP/mes", "monthlyVisits": "X–X visitas", "dailyVisits": "X–X/día", "costPerVisit": "$X–$Y COP"},
      {"scenario": "Escala",      "investment": "$X COP/mes", "monthlyVisits": "X–X visitas", "dailyVisits": "X–X/día", "costPerVisit": "$X–$Y COP"}
    ],
    "whatWeNeedFromYou": [
      "<b>Aprobar el presupuesto</b>: definir con qué escenario empezamos.",
      "<b>Acceso al dominio</b>: para instalar el pixel de seguimiento.",
      "<b>Número de teléfono</b>: para la extensión de llamada.",
      "<b>Fotos del negocio</b>: para anuncios visuales si aplica.",
      "<b>Revisión de copies</b>: leer y aprobar los textos de los anuncios antes de activar."
    ],
    "ourPromise": [
      "Activamos los anuncios solo cuando todo esté configurado correctamente.",
      "Te reportamos resultados cada semana: clics, visitas y costo por visita.",
      "Optimizamos las campañas continuamente basándonos en datos reales.",
      "Nunca activamos palabras clave que puedan traer tráfico irrelevante.",
      "Si algo no funciona, te avisamos antes de que se gaste el presupuesto."
    ],
    "closing": "<b>¿Empezamos?</b> texto final motivador y específico para ${input.clientName} en ${input.city}..."
  }
}

MÍNIMOS:
- whereYouAppear: 5 ubicaciones distintas
- campaignsExplained: exactamente 3
- expectedResults: exactamente 3`;
}

// ─────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────
export async function generateAuditJson(
  input: AuditInput,
  site: ScrapedSite,
  seeds?: KeywordResearchResult[],
): Promise<any> {
  // Call 1: keywords + on-page + technical
  console.log('[claude] Auditoría 1/3: datos técnicos (keywords, on-page, técnica)…');
  const dataResult = await callClaude(SYSTEM_AUDIT, buildAuditDataPrompt(input, site, seeds), 16000);

  // Call 2: strategic plan + all narrative sections
  console.log('[claude] Auditoría 2/3: análisis estratégico y plan…');
  const planResult = await callClaude(SYSTEM_AUDIT, buildAuditPlanPrompt(input, site, dataResult), 16000);

  // Call 3: client-facing report
  console.log('[claude] Auditoría 3/3: informe cliente…');
  const clientResult = await callClaude(SYSTEM_AUDIT, buildAuditClientPrompt(input, site, { data: dataResult, plan: planResult }), 12000);

  return {
    meta: {
      clientName: input.clientName,
      url: input.websiteUrl,
      city: input.city,
      country: input.country,
      date: 'Abril 2026',
    },
    agency: {
      ...planResult,           // index, executiveSummary, methodology, context, contentGap, localSeo, eeat, benchmark, actionPlan, kpis, roadmap, stack, annexes
      ...dataResult,           // keywords, onPage, technical, technicalCallout
    },
    client: clientResult.client,
  };
}

export async function generateAdsJson(
  input: AuditInput,
  auditJson: any,
): Promise<any> {
  // Call 1: agency strategy
  console.log('[claude] Ads 1/2: estrategia agencia…');
  const agencyResult = await callClaude(SYSTEM_ADS, buildAdsAgencyPrompt(input, auditJson), 16000);

  // Call 2: client presentation
  console.log('[claude] Ads 2/2: presentación cliente…');
  const clientResult = await callClaude(SYSTEM_ADS, buildAdsClientPrompt(input, agencyResult.agency), 8000);

  return {
    meta: {
      clientName: input.clientName,
      city: input.city,
      monthlyBudgetCOP: input.monthlyBudgetCOP,
      date: 'Abril 2026',
    },
    agency: agencyResult.agency,
    client: clientResult.client,
  };
}
