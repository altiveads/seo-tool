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

// ─────────────────────────────────────────────────────────
// SISTEMA: tono y reglas de output
// ─────────────────────────────────────────────────────────
const SYSTEM_AUDIT = `Eres un consultor SEO senior con 20 años de experiencia en mercados hispanohablantes, especializado en salud, servicios profesionales y SEO local. Trabajas para la agencia Altive.

Tu trabajo hoy: analizar el sitio web de un cliente y entregar DOS informes en formato JSON.
1. Informe AGENCIA (técnico, detallado, jerga SEO)
2. Informe CLIENTE (sin tecnicismos, narrativo, como si se lo explicaras a un empresario en una reunión)

REGLAS ABSOLUTAS:
- Respondes ÚNICAMENTE con un objeto JSON válido. Sin texto antes ni después.
- Todo el texto en español colombiano profesional.
- Usa formato HTML mínimo en strings: <b>negrita</b> <i>cursiva</i> — nada más.
- El informe de cliente debe sonar HUMANO y DIAGNÓSTICO, no como un reporte automático.
- Personaliza cada texto con el nombre real del cliente, ciudad, servicios específicos y médicos/personas mencionadas en el sitio.
- El tono del cliente es: "somos tus aliados, te explicamos lo que vemos y lo que haremos".
- Para el informe agencia: técnico, accionable, con criterios claros.
- Mínimo de contenido: cumple los mínimos indicados en el prompt o la respuesta se considera incompleta.
- No inventes URLs, teléfonos ni datos: usa lo que se scrapeó o indica "(verificar con cliente)".
- Cumples políticas YMYL: nada de promesas médicas absolutas.`;

// ─────────────────────────────────────────────────────────
// PROMPT AUDITORÍA (genera JSON para ambos PDFs)
// ─────────────────────────────────────────────────────────
function buildAuditPrompt(
  input: AuditInput,
  site: ScrapedSite,
  seeds?: KeywordResearchResult[],
): string {
  const kwText = seeds?.length
    ? `\nKEYWORDS ENCONTRADAS (Google autocomplete):\n${seeds.map(s =>
        `• "${s.seed}": ${s.suggestions.slice(0, 20).join(', ')}`).join('\n')}`
    : '';

  return `Genera la auditoría SEO completa para este cliente.

DATOS DEL CLIENTE:
- Nombre: ${input.clientName}
- URL: ${input.websiteUrl}
- Ciudad: ${input.city}, ${input.country}
- Competidores conocidos: ${(input.competitors || []).join(', ') || 'detectar automáticamente'}
- Objetivos: ${input.objectives.join(', ')}${input.customObjective ? ' | ' + input.customObjective : ''}
- Presupuesto Ads (COP): ${input.monthlyBudgetCOP ?? 'no especificado'}

SITIO SCRAPEADO:
- Title: ${site.title || '(vacío)'}
- Meta desc: ${site.metaDescription || '(vacía)'}
- H1: ${site.h1 || '(no detectado)'}
- H2s: ${site.h2s.slice(0, 12).join(' | ')}
- H3s: ${site.h3s.slice(0, 10).join(' | ')}
- CMS: ${site.cms || 'desconocido'}
- Schema JSON-LD: ${site.hasSchema ? 'presente' : 'ausente'}
- Open Graph: ${site.hasOpenGraph ? 'presente' : 'ausente'}
- Sitemap: ${site.sitemapStatus}
- Lang: ${site.lang || '(no declarado)'}
- Canonical: ${site.canonical || '(no)'}
- Redes: ${Object.keys(site.social).join(', ') || 'ninguna'}
- Imágenes sin alt: ${site.images.filter(i => !i.alt).length}/${site.images.length}
- URLs internas: ${site.internalLinks.join(', ')}
- Cuerpo del sitio: ${site.bodyText.slice(0, 2000)}
${kwText}

Devuelve EXACTAMENTE este JSON (sin nada antes ni después):

{
  "meta": {
    "clientName": "${input.clientName}",
    "url": "${input.websiteUrl}",
    "city": "${input.city}",
    "country": "${input.country}",
    "date": "Abril 2026"
  },

  "agency": {
    "index": [
      "1. Resumen Ejecutivo",
      "2. Metodología y Alcance",
      "3. Contexto del Negocio y Competencia Local",
      "4. Investigación de Palabras Clave",
      "5. Auditoría On-Page",
      "6. Auditoría Técnica",
      "7. Análisis de Contenido y Brechas",
      "8. SEO Local (GBP + NAP)",
      "9. Autoridad, Backlinks y E-E-A-T",
      "10. Benchmark vs. Competidores",
      "11. Plan de Acción Priorizado",
      "12. KPIs, Medición y Roadmap",
      "13. Anexos"
    ],
    "executiveSummary": {
      "paragraphs": ["párrafo 1 con diagnóstico técnico específico...", "párrafo 2..."],
      "diagnosis": "FUNDACIÓN DÉBIL — REQUIERE INTERVENCIÓN INMEDIATA",
      "priorities": [
        {"rank": 1, "title": "...", "impact": "ALTO", "effort": "Bajo", "window": "7 días"}
      ],
      "callout": "<b>Oportunidad estratégica.</b> texto específico del nicho..."
    },
    "methodology": {
      "paragraphs": ["..."],
      "tools": ["Inspección manual del HTML de ${input.websiteUrl}", "..."]
    },
    "context": {
      "paragraphs": ["texto con datos específicos del cliente: dirección, nombre del médico/dueño, servicios principales..."],
      "competitors": [
        {"name": "...", "strength": "...", "weakness": "...", "threat": "Alta|Media|Baja"}
      ],
      "callout": "<b>Lectura estratégica.</b> ..."
    },
    "keywords": {
      "paragraphs": ["..."],
      "transactional": [
        {"keyword": "...", "intent": "Transaccional", "difficulty": "Alta|Media|Baja", "volume": "Muy alto|Alto|Medio-Alto|Medio|Bajo", "priority": "P1|P2|P3"}
      ],
      "symptoms": [
        {"keyword": "...", "intent": "Informacional", "difficulty": "Baja", "volume": "Alto"}
      ],
      "brand": [
        {"keyword": "...", "objective": "..."}
      ],
      "callout": "<b>Nota metodológica.</b> ..."
    },
    "onPage": {
      "items": [
        {"element": "Title tag", "current": "...", "problem": "...", "severity": "CRÍTICO|ALTO|MEDIO|BAJO|OK"}
      ],
      "templates": [
        {"label": "Title tag home (ejemplo)", "value": "..."}
      ]
    },
    "technical": [
      {"check": "CMS", "status": "WordPress|Webflow|etc", "detail": "..."}
    ],
    "technicalCallout": "<b>Prioridad técnica #1.</b> ...",
    "contentGap": {
      "paragraphs": ["..."],
      "items": [
        {"url": "/servicios/...", "type": "Landing|Blog|FAQ", "keyword": "...", "priority": "P1|P2|P3"}
      ],
      "clusters": ["<b>Pillar 1 — ...</b> explicación..."]
    },
    "localSeo": {
      "paragraphs": ["..."],
      "items": [
        {"item": "Ficha GBP verificada", "action": "..."}
      ],
      "callout": "..."
    },
    "eeat": {
      "paragraphs": ["El sector es YMYL..."],
      "checklist": ["Página de autor con credenciales..."],
      "linkBuilding": [
        {"lever": "Directorios médicos", "objective": "Backlinks + citations", "priority": "P1"}
      ]
    },
    "benchmark": {
      "headers": ["Dimensión", "${input.clientName}", "Competidor A", "Competidor B", "Ganador"],
      "rows": [["# páginas indexables", "~1", "~100+", "~50+", "Competidores"]],
      "colWidths": [3.7, 2.5, 2.3, 2.5, 2.5],
      "callout": "..."
    },
    "actionPlan": {
      "quickWins": [
        {"action": "...", "impact": "Alto|Muy alto|Medio", "effort": "Bajo|Medio|Alto"}
      ],
      "strategic": [
        {"action": "...", "impact": "Muy alto", "effort": "Alto"}
      ]
    },
    "kpis": [
      {"kpi": "Sesiones orgánicas / mes", "baseline": "<300", "m3": "1.500", "m6": "4.500"}
    ],
    "roadmap": [
      {"month": "Mes 1", "focus": "...", "deliverable": "..."}
    ],
    "stack": ["<b>Analítica:</b> GA4, GSC, Looker Studio", "..."],
    "annexes": {
      "ymyl": ["Evitar promesas médicas absolutas...", "..."],
      "risks": [
        {"risk": "...", "mitigation": "..."}
      ],
      "nextSteps": ["Aprobación del plan...", "..."],
      "closing": "<b>Cierre.</b> texto motivador personalizado con el nombre del cliente..."
    }
  },

  "client": {
    "cover": {
      "title": "Tu presencia en Google hoy",
      "subtitle": "Diagnóstico sencillo y plan de mejora",
      "tagline": "Un documento pensado para ti, sin tecnicismos."
    },
    "intro": {
      "title": "¿Para qué sirve este documento?",
      "paragraphs": [
        "párrafo personalizado explicando qué es esto y para qué le sirve AL CLIENTE ESPECÍFICO...",
        "segundo párrafo..."
      ],
      "callout": "<b>La idea en una frase.</b> texto muy específico sobre el cliente, su fortaleza y lo que le falta en digital..."
    },
    "seoSection": {
      "title": "1. ¿Qué es SEO, explicado fácil?",
      "paragraphs": ["Cuando alguien en ${input.city} busca..."],
      "benefits": ["Los pacientes/clientes te encuentran sin pagar por cada clic.", "..."]
    },
    "diagnosis": {
      "title": "2. Cómo está tu página web hoy",
      "intro": "texto introductorio específico del cliente...",
      "goodTitle": "Lo que está bien",
      "good": ["<b>punto positivo específico</b>: explicación...", "..."],
      "missingTitle": "Lo que le hace falta",
      "missing": ["<b>problema específico</b>: explicación en lenguaje simple...", "..."],
      "callout": "<b>Cómo lo resumimos.</b> analogía clara y memorable personalizada para este negocio..."
    },
    "competitors": {
      "title": "3. ¿Contra quién compites en Google?",
      "intro": "Estos son los nombres con los que peleas por aparecer arriba cuando alguien busca en ${input.city}:",
      "rows": [
        {"name": "...", "strength": "..."}
      ],
      "callout": "<b>Buena noticia.</b> texto sobre el diferencial del cliente vs la competencia..."
    },
    "opportunities": {
      "title": "4. Las oportunidades más grandes",
      "intro": "Estas son las jugadas que más impacto van a tener, ordenadas de la más urgente a la más estratégica.",
      "items": [
        {"title": "nombre de la oportunidad", "why": "explicación en lenguaje simple del impacto real para el negocio..."}
      ]
    },
    "plan": {
      "title": "5. Qué vamos a hacer (plan de 6 meses)",
      "intro": "Trabajamos por etapas para que en cada mes veas avances concretos. Así se ve el plan:",
      "rows": [
        {"month": "Mes 1", "work": "qué hacemos nosotros...", "gain": "qué gana el cliente..."}
      ]
    },
    "results": {
      "title": "6. ¿Qué vas a ver en resultados?",
      "intro": "texto contextualizado para ${input.city} y el tipo de negocio...",
      "rows": [
        {"kpi": "Visitas al mes desde Google", "now": "Muy pocas", "m3": "...", "m6": "..."}
      ],
      "callout": "<b>Importante.</b> texto sobre la naturaleza del SEO como inversión a largo plazo..."
    },
    "needs": {
      "title": "7. Lo único que necesitamos de ti",
      "items": ["<b>Accesos</b> a la página web...", "..."]
    },
    "closing": {
      "title": "Cierre",
      "paragraphs": [
        "párrafo 1: síntesis de fortalezas del cliente y oportunidad digital...",
        "párrafo 2: motivador, sobre los resultados que se acumulan..."
      ],
      "callout": "<b>La próxima acción.</b> texto claro sobre el siguiente paso concreto..."
    }
  }
}

MÍNIMOS OBLIGATORIOS:
- agency.executiveSummary.priorities: mínimo 5
- agency.context.competitors: mínimo 5
- agency.keywords.transactional: mínimo 12
- agency.keywords.symptoms: mínimo 12
- agency.keywords.brand: mínimo 5
- agency.onPage.items: mínimo 12
- agency.technical: mínimo 15
- agency.contentGap.items: mínimo 15
- agency.localSeo.items: mínimo 12
- agency.eeat.checklist: mínimo 8
- agency.eeat.linkBuilding: mínimo 7
- agency.actionPlan.quickWins: mínimo 10
- agency.actionPlan.strategic: mínimo 10
- agency.kpis: mínimo 8
- agency.roadmap: mínimo 6
- client.diagnosis.good: mínimo 5 (muy específicos del cliente)
- client.diagnosis.missing: mínimo 6 (en lenguaje simple)
- client.competitors.rows: mínimo 5
- client.opportunities.items: mínimo 7
- client.plan.rows: mínimo 6
- client.results.rows: mínimo 5`;
}

// ─────────────────────────────────────────────────────────
// PROMPT ADS
// ─────────────────────────────────────────────────────────
const SYSTEM_ADS = `Eres un Google Ads Specialist senior certificado con 15 años de experiencia. Trabajas para la agencia Altive. Conoces a fondo las políticas de anuncios de Google (incluyendo restricciones en salud, finanzas y servicios profesionales) y la estructura óptima de campañas de búsqueda.

REGLAS:
- Respondes ÚNICAMENTE con JSON válido.
- Español colombiano profesional.
- Usa <b> e <i> para formato en strings.
- Cumple políticas Google Ads: sin promesas absolutas de resultados, sin afirmaciones médicas/legales no respaldadas.
- Los CPC y presupuestos en COP si el cliente es colombiano.
- El informe cliente: lenguaje simple, sin jerga técnica, tono aliado.`;

function buildAdsPrompt(input: AuditInput, auditJson: any): string {
  const competitors = auditJson?.agency?.context?.competitors?.map((c: any) => c.name).join(', ') || '';
  const kwTx = auditJson?.agency?.keywords?.transactional?.slice(0, 8).map((k: any) => k.keyword).join(', ') || '';
  const kwSy = auditJson?.agency?.keywords?.symptoms?.slice(0, 8).map((k: any) => k.keyword).join(', ') || '';

  return `Genera la estrategia completa de Google Ads para este cliente.

CONTEXTO:
- Cliente: ${input.clientName}
- Ciudad: ${input.city}, ${input.country}
- Presupuesto mensual (COP): ${input.monthlyBudgetCOP ?? 'no especificado — propón 3 escenarios'}
- Objetivos: ${input.objectives.join(', ')}${input.customObjective ? ' | ' + input.customObjective : ''}
- Competidores detectados: ${competitors}
- Keywords transaccionales del cliente: ${kwTx}
- Keywords síntomas del cliente: ${kwSy}

OBJETIVO PRINCIPAL: máximo tráfico hacia el sitio web — no conversiones directas.
3 CAMPAÑAS OBLIGATORIAS: Síntomas (C1) · Servicios (C2) · Marca (C3).

Devuelve EXACTAMENTE este JSON:

{
  "meta": {
    "clientName": "${input.clientName}",
    "city": "${input.city}",
    "monthlyBudgetCOP": ${input.monthlyBudgetCOP ?? 0},
    "date": "Abril 2026"
  },

  "agency": {
    "thesis": "texto técnico sobre la estrategia...",
    "policies": [
      {"policy": "nombre política", "application": "cómo aplica a este cliente específicamente"}
    ],
    "campaigns": [
      {
        "id": "symptoms",
        "name": "C1 – Síntomas / Descubrimiento",
        "intent": "Informacional",
        "volumeTarget": "Alto (40% del presupuesto)",
        "cpcRange": "$X – $Y COP",
        "adGroups": [
          {
            "name": "GRUPO_NOMBRE",
            "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8"],
            "landing": "/url-recomendada"
          }
        ],
        "adCopy": {
          "headlines": ["titular 1 (máx 30 car)", "titular 2", "titular 3", "titular 4", "titular 5", "titular 6", "titular 7", "titular 8", "titular 9", "titular 10", "titular 11", "titular 12", "titular 13", "titular 14", "titular 15"],
          "descriptions": ["descripción 1 (máx 90 car)", "descripción 2", "descripción 3", "descripción 4"]
        },
        "extensions": ["Sitelink: ...", "Fragmento estructurado: ...", "Llamada: ...", "Extracto de texto: ..."]
      },
      {
        "id": "services",
        "name": "C2 – Servicios / Comercial",
        "intent": "Comercial / Transaccional",
        "volumeTarget": "Medio-Alto (40% del presupuesto)",
        "cpcRange": "$X – $Y COP",
        "adGroups": [],
        "adCopy": { "headlines": [], "descriptions": [] },
        "extensions": []
      },
      {
        "id": "brand",
        "name": "C3 – Marca / Defensa",
        "intent": "Navegacional / Marca",
        "volumeTarget": "Bajo (20% del presupuesto)",
        "cpcRange": "$X – $Y COP",
        "adGroups": [],
        "adCopy": { "headlines": [], "descriptions": [] },
        "extensions": []
      }
    ],
    "budgetScenarios": [
      {"name": "Arranque", "total": "$X COP/mes", "c1": "$X", "c2": "$X", "c3": "$X", "clicksEstimate": "X–X clicks/mes"},
      {"name": "Crecimiento", "total": "$X COP/mes", "c1": "$X", "c2": "$X", "c3": "$X", "clicksEstimate": "X–X clicks/mes"},
      {"name": "Escala", "total": "$X COP/mes", "c1": "$X", "c2": "$X", "c3": "$X", "clicksEstimate": "X–X clicks/mes"}
    ],
    "targeting": {
      "locations": ["${input.city}", "..."],
      "devices": "descripción de estrategia por dispositivo...",
      "schedule": "descripción de horario...",
      "audiences": ["Visitantes previos (RLSA)", "..."]
    },
    "measurement": {
      "events": [
        {"event": "nombre_evento", "category": "Primary|Secondary", "trigger": "qué lo dispara"}
      ],
      "stack": ["GA4", "GTM", "Google Ads Conversion Tag"]
    },
    "negatives": {
      "global": ["gratis", "gratuito", "youtube", "..."],
      "byCampaign": [
        {"campaign": "C1 Síntomas", "items": ["cirugía", "precio", "costo", "..."]},
        {"campaign": "C2 Servicios", "items": ["síntoma", "qué es", "..."]},
        {"campaign": "C3 Marca", "items": ["competidor1", "..."] }
      ]
    }
  },

  "client": {
    "cover": {
      "title": "Cómo vamos a aparecer en Google",
      "subtitle": "${input.clientName} — Plan de Publicidad Digital"
    },
    "theIdea": "texto simple (3-4 oraciones) explicando la estrategia en lenguaje de negocio, sin jerga...",
    "whereYouAppear": [
      {"location": "Primer resultado de Google (encima de todos)", "userSees": "qué ve el usuario exactamente..."}
    ],
    "campaignsExplained": [
      {
        "name": "Campaña 1: Síntomas",
        "explanation": "explicación simple de para qué sirve esta campaña y qué tipo de persona la va a ver..."
      },
      {"name": "Campaña 2: Servicios", "explanation": "..."},
      {"name": "Campaña 3: Tu Marca", "explanation": "..."}
    ],
    "expectedResults": [
      {"scenario": "Arranque", "investment": "$X COP/mes", "monthlyVisits": "X–X visitas", "dailyVisits": "X–X visitas/día", "costPerVisit": "$X–$Y COP"},
      {"scenario": "Crecimiento", "investment": "$X COP/mes", "monthlyVisits": "...", "dailyVisits": "...", "costPerVisit": "..."},
      {"scenario": "Escala",      "investment": "$X COP/mes", "monthlyVisits": "...", "dailyVisits": "...", "costPerVisit": "..."}
    ],
    "whatWeNeedFromYou": ["<b>Aprobar el presupuesto</b>: ...", "<b>Acceso al dominio</b>: ..."],
    "ourPromise": ["texto de promesa 1...", "..."],
    "closing": "<b>¿Empezamos?</b> texto final motivador personalizado..."
  }
}

MÍNIMOS:
- policies: 6+
- Cada campaña: mínimo 6 adGroups × 8 keywords = 48 keywords por campaña
- Cada campaña: exactamente 15 headlines y 4 descriptions
- budgetScenarios: exactamente 3
- measurement.events: 6+
- negatives.global: 15+
- whereYouAppear: 5+
- campaignsExplained: exactamente 3
- expectedResults: exactamente 3
- whatWeNeedFromYou: 5+
- ourPromise: 5+`;
}

// ─────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────
export async function generateAuditJson(
  input: AuditInput,
  site: ScrapedSite,
  seeds?: KeywordResearchResult[],
): Promise<any> {
  const client = getClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_AUDIT,
    messages: [{ role: 'user', content: buildAuditPrompt(input, site, seeds) }],
  });
  const text = msg.content
    .filter(b => b.type === 'text')
    .map(b => (b as any).text)
    .join('\n');
  return extractJson(text);
}

export async function generateAdsJson(
  input: AuditInput,
  auditJson: any,
): Promise<any> {
  const client = getClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_ADS,
    messages: [{ role: 'user', content: buildAdsPrompt(input, auditJson) }],
  });
  const text = msg.content
    .filter(b => b.type === 'text')
    .map(b => (b as any).text)
    .join('\n');
  return extractJson(text);
}
