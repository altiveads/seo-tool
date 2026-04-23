import Anthropic from '@anthropic-ai/sdk';
import type { AuditInput } from './types';

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
  if (start === -1 || end === -1) throw new Error('No se encontró JSON en la respuesta de Claude (roadmap).');
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
    throw new Error(`Respuesta truncada en roadmap (max_tokens=${maxTokens}).`);
  }
  const text = msg.content
    .filter(b => b.type === 'text')
    .map(b => (b as any).text)
    .join('\n');
  return extractJson(text);
}

// ─────────────────────────────────────────────────────────
// SISTEMA
// ─────────────────────────────────────────────────────────
const SYSTEM_ROADMAP = `Eres Director de Estrategia y Project Manager Senior de la agencia Altive. Tu tarea es construir roadmaps estratégicos integrados de marketing digital que son específicos, accionables y realistas.

PRINCIPIOS DEL ROADMAP ALTIVE:
- El roadmap no es una lista de tareas: es un plan con lógica de dependencias
- Las prioridades se ordenan por impacto, no por facilidad de ejecución
- Lógica obligatoria: SEO técnico → escala de ads | optimización de conversión → pauta agresiva | configuración de pixel → campaña activa
- Cada hito tiene propietario claro (Agencia|Cliente|Ambos) y criterio de éxito medible
- Separa acciones de fundamento (que habilitan las siguientes) de acciones de ejecución

REGLAS ABSOLUTAS:
- Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después.
- Español colombiano profesional.
- HTML permitido solo en strings: <b>negrita</b> <i>cursiva</i>
- LÍMITES DE LONGITUD:
  * Campos "paragraphs": máximo 55 palabras por string
  * Campos "action": máximo 15 palabras
  * Campos "milestone", "kpi", "whatYouWillSee": máximo 20 palabras
  * Campos "successCriteria", "contingency": máximo 20 palabras
  * Campos "vision", "logic": máximo 35 palabras
- Sé específico: nombres de acciones en imperativo, KPIs con valores concretos`;

// ─────────────────────────────────────────────────────────
// AGENCIA — Call 1/2
// ─────────────────────────────────────────────────────────
function buildRoadmapAgencyPrompt(
  input: AuditInput,
  marketResearchJson: any,
  auditJson: any,
  metaAdsJson: any,
  adsJson: any,
): string {
  const mrRecs = marketResearchJson?.agency?.recommendations?.slice(0, 3)
    .map((r: any) => r.recommendation).join('; ') || '';
  const auditQuickWins = auditJson?.agency?.actionPlan?.quickWins?.slice(0, 4)
    .map((q: any) => q.action).join('; ') || '';
  const auditDiagnosis = auditJson?.agency?.executiveSummary?.diagnosis || '';
  const metaAngle = metaAdsJson?.agency?.communicationAngle?.angle || '';
  const metaObjective = metaAdsJson?.agency?.campaignObjective?.strategic || '';
  const adsCampaigns = adsJson?.agency?.campaigns?.map((c: any) => c.name).join(', ') || '';

  return `Construye el roadmap estratégico integrado AGENCIA de 3 meses para ${input.clientName}.

DATOS DEL NEGOCIO:
- Nombre: ${input.clientName}
- Tipo de negocio: ${input.businessType || '(no especificado)'}
- Sector: ${input.sector || '(no especificado)'}
- Ciudad: ${input.city}
- Objetivo mensual: ${input.monthlyGoal || '(no especificado)'}
- Presupuesto Meta Ads: ${input.metaAdsBudget || '(no especificado)'}
- Presupuesto Google Ads: ${input.monthlyBudgetCOP ? `$${input.monthlyBudgetCOP.toLocaleString()} COP/mes` : '(no especificado)'}

SÍNTESIS DE ANÁLISIS PREVIOS:
- Diagnóstico SEO: ${auditDiagnosis || '(no disponible)'}
- Quick wins SEO: ${auditQuickWins || '(no disponible)'}
- Recomendaciones de mercado: ${mrRecs || '(no disponible)'}
- Objetivo estratégico Meta Ads: ${metaObjective || '(no disponible)'}
- Ángulo de comunicación Meta: ${metaAngle || '(no disponible)'}
- Campañas Google Ads: ${adsCampaigns || '(no disponible)'}

Devuelve EXACTAMENTE este JSON:

{
  "executiveSummary": {
    "vision": "visión del trimestre en una oración: qué transformación logra ${input.clientName} en 3 meses...",
    "priorities": ["prioridad estratégica 1 del trimestre", "prioridad 2", "prioridad 3", "prioridad 4", "prioridad 5"],
    "logic": "por qué el plan tiene este orden: la lógica de dependencias que explica la secuencia..."
  },
  "startingPoint": {
    "strengths": ["fortaleza actual de ${input.clientName} que no hay que tocar 1", "fortaleza 2", "fortaleza 3"],
    "criticalGaps": ["brecha crítica que hay que resolver urgente 1", "brecha 2", "brecha 3"],
    "urgentNeeds": ["qué debe resolverse antes de activar pauta 1", "qué debe resolverse 2"]
  },
  "months": [
    {
      "month": "Mes 1",
      "theme": "Fundamentos",
      "focus": "descripción del enfoque del mes 1 para ${input.clientName}...",
      "weeks": [
        {
          "week": "Semana 1",
          "actions": [
            {"action": "acción específica en imperativo", "owner": "Agencia|Cliente|Ambos"},
            {"action": "acción 2", "owner": "Agencia|Cliente|Ambos"},
            {"action": "acción 3", "owner": "Agencia|Cliente|Ambos"}
          ]
        },
        {
          "week": "Semana 2",
          "actions": [
            {"action": "acción específica", "owner": "Agencia|Cliente|Ambos"},
            {"action": "acción 2", "owner": "Agencia|Cliente|Ambos"},
            {"action": "acción 3", "owner": "Agencia|Cliente|Ambos"}
          ]
        },
        {
          "week": "Semana 3",
          "actions": [
            {"action": "acción específica", "owner": "Agencia|Cliente|Ambos"},
            {"action": "acción 2", "owner": "Agencia|Cliente|Ambos"}
          ]
        },
        {
          "week": "Semana 4",
          "actions": [
            {"action": "acción específica", "owner": "Agencia|Cliente|Ambos"},
            {"action": "acción 2", "owner": "Agencia|Cliente|Ambos"},
            {"action": "acción 3 — cierre del mes", "owner": "Agencia|Cliente|Ambos"}
          ]
        }
      ],
      "milestone": "qué debe estar listo al terminar el mes 1...",
      "kpi": "KPI concreto con valor medible para el mes 1..."
    },
    {
      "month": "Mes 2",
      "theme": "Activación",
      "focus": "descripción del enfoque del mes 2...",
      "weeks": [
        {"week": "Semana 1", "actions": [{"action": "acción", "owner": "Agencia"}, {"action": "acción 2", "owner": "Ambos"}]},
        {"week": "Semana 2", "actions": [{"action": "acción", "owner": "Agencia"}, {"action": "acción 2", "owner": "Agencia"}]},
        {"week": "Semana 3", "actions": [{"action": "acción", "owner": "Ambos"}, {"action": "acción 2", "owner": "Agencia"}]},
        {"week": "Semana 4", "actions": [{"action": "acción", "owner": "Agencia"}, {"action": "acción 2 — cierre mes 2", "owner": "Ambos"}]}
      ],
      "milestone": "qué debe estar listo al terminar el mes 2...",
      "kpi": "KPI concreto con valor medible para el mes 2..."
    },
    {
      "month": "Mes 3",
      "theme": "Optimización y Escala",
      "focus": "descripción del enfoque del mes 3...",
      "weeks": [
        {"week": "Semana 1", "actions": [{"action": "acción", "owner": "Agencia"}, {"action": "acción 2", "owner": "Agencia"}]},
        {"week": "Semana 2", "actions": [{"action": "acción", "owner": "Ambos"}, {"action": "acción 2", "owner": "Agencia"}]},
        {"week": "Semana 3", "actions": [{"action": "acción", "owner": "Agencia"}, {"action": "acción 2", "owner": "Agencia"}]},
        {"week": "Semana 4", "actions": [{"action": "acción — evaluación trimestral", "owner": "Ambos"}, {"action": "acción 2 — decisión de escala", "owner": "Ambos"}]}
      ],
      "milestone": "qué debe estar listo al terminar el mes 3...",
      "kpi": "KPI concreto con valor medible para el mes 3..."
    }
  ],
  "initiativesTable": [
    {"name": "nombre de la iniciativa 1", "module": "SEO|Meta Ads|Google Ads|Contenido|Conversión|Comercial", "owner": "Agencia|Cliente|Ambos", "startWeek": "S1|S2|S3...", "duration": "1 sem|2 sem|1 mes", "dependency": "qué debe estar listo antes o 'Ninguna'", "successCriteria": "cómo se mide el éxito", "impact": "Alto|Medio|Bajo", "effort": "Alto|Medio|Bajo"},
    {"name": "iniciativa 2", "module": "...", "owner": "...", "startWeek": "...", "duration": "...", "dependency": "...", "successCriteria": "...", "impact": "Alto", "effort": "Bajo"},
    {"name": "iniciativa 3", "module": "...", "owner": "...", "startWeek": "...", "duration": "...", "dependency": "...", "successCriteria": "...", "impact": "Alto", "effort": "Medio"},
    {"name": "iniciativa 4", "module": "...", "owner": "...", "startWeek": "...", "duration": "...", "dependency": "...", "successCriteria": "...", "impact": "Medio", "effort": "Bajo"},
    {"name": "iniciativa 5", "module": "...", "owner": "...", "startWeek": "...", "duration": "...", "dependency": "...", "successCriteria": "...", "impact": "Medio", "effort": "Medio"},
    {"name": "iniciativa 6", "module": "...", "owner": "...", "startWeek": "...", "duration": "...", "dependency": "...", "successCriteria": "...", "impact": "Alto", "effort": "Alto"},
    {"name": "iniciativa 7", "module": "...", "owner": "...", "startWeek": "...", "duration": "...", "dependency": "...", "successCriteria": "...", "impact": "Medio", "effort": "Bajo"},
    {"name": "iniciativa 8", "module": "...", "owner": "...", "startWeek": "...", "duration": "...", "dependency": "...", "successCriteria": "...", "impact": "Bajo", "effort": "Bajo"}
  ],
  "quickWins": [
    {"action": "acción de quick win 1 (alto impacto, bajo esfuerzo, ejecución inmediata)", "why": "por qué ahora y no después", "owner": "Agencia|Cliente", "metric": "cómo se mide"},
    {"action": "quick win 2", "why": "...", "owner": "...", "metric": "..."},
    {"action": "quick win 3", "why": "...", "owner": "...", "metric": "..."},
    {"action": "quick win 4", "why": "...", "owner": "...", "metric": "..."},
    {"action": "quick win 5", "why": "...", "owner": "...", "metric": "..."}
  ],
  "budgetAllocation": [
    {"period": "Mes 1", "metaAds": "${input.metaAdsBudget || 'a definir'}", "googleAds": "${input.monthlyBudgetCOP ? `$${input.monthlyBudgetCOP.toLocaleString()} COP` : 'a definir'}", "total": "suma total", "logic": "por qué esta distribución en el mes 1 (fundamentos primero)"},
    {"period": "Mes 2", "metaAds": "presupuesto mes 2", "googleAds": "presupuesto mes 2", "total": "suma total", "logic": "por qué esta distribución en el mes 2 (activación)"},
    {"period": "Mes 3", "metaAds": "presupuesto mes 3", "googleAds": "presupuesto mes 3", "total": "suma total", "logic": "criterio para escalar o mantener en mes 3"}
  ],
  "risks": [
    {"risk": "riesgo principal del plan 1", "alert": "señal de alerta temprana", "contingency": "qué hacer si ocurre"},
    {"risk": "riesgo 2", "alert": "señal de alerta", "contingency": "acción de contingencia"},
    {"risk": "riesgo 3", "alert": "señal de alerta", "contingency": "acción de contingencia"},
    {"risk": "riesgo 4", "alert": "señal de alerta", "contingency": "acción de contingencia"}
  ],
  "clientCommitments": [
    "qué necesita entregar o hacer el cliente para que el plan funcione 1",
    "compromiso del cliente 2",
    "compromiso 3",
    "compromiso 4",
    "compromiso 5"
  ],
  "trackingMetrics": [
    {"kpi": "KPI de seguimiento 1", "frequency": "Semanal|Quincenal|Mensual", "baseline": "valor inicial estimado", "target": "meta al final del trimestre"},
    {"kpi": "KPI 2", "frequency": "...", "baseline": "...", "target": "..."},
    {"kpi": "KPI 3", "frequency": "...", "baseline": "...", "target": "..."},
    {"kpi": "KPI 4", "frequency": "...", "baseline": "...", "target": "..."},
    {"kpi": "KPI 5", "frequency": "...", "baseline": "...", "target": "..."},
    {"kpi": "KPI 6", "frequency": "...", "baseline": "...", "target": "..."}
  ]
}

MÍNIMOS: months: exactamente 3 con 4 semanas cada uno | initiativesTable: 8 iniciativas | quickWins: 5 | budgetAllocation: 3 períodos | risks: 4 | trackingMetrics: 6`;
}

// ─────────────────────────────────────────────────────────
// CLIENTE — Call 2/2
// ─────────────────────────────────────────────────────────
function buildRoadmapClientPrompt(input: AuditInput, agencyData: any): string {
  const vision = agencyData?.executiveSummary?.vision || '';
  const qw = agencyData?.quickWins?.slice(0, 3).map((q: any) => q.action).join('; ') || '';
  const month1Milestone = agencyData?.months?.[0]?.milestone || '';
  const month3Milestone = agencyData?.months?.[2]?.milestone || '';

  return `Genera el plan 3 meses CLIENTE para ${input.clientName}. Tono: sencillo, motivador, orientado a resultados de negocio, sin terminología técnica.

CLIENTE: ${input.clientName} | ${input.city}
VISIÓN DEL TRIMESTRE: ${vision}
QUICK WINS: ${qw}
LOGRO MES 1: ${month1Milestone}
LOGRO MES 3: ${month3Milestone}

Devuelve EXACTAMENTE este JSON (con la clave "client"):

{
  "client": {
    "cover": {
      "title": "Tu plan de crecimiento digital",
      "subtitle": "${input.clientName} — Próximos 3 meses"
    },
    "vision": "en una oración, qué logra ${input.clientName} al final del trimestre en términos de negocio (no de métricas digitales)...",
    "months": [
      {
        "month": "Mes 1",
        "theme": "Construimos la base",
        "whatWeWillDo": [
          "qué hace Altive este mes (lenguaje simple, orientado a beneficios para el negocio) 1",
          "qué hace Altive 2",
          "qué hace Altive 3",
          "qué necesitamos de ${input.clientName} este mes"
        ],
        "whatYouWillSee": "qué resultado concreto o cambio visible percibe ${input.clientName} al terminar el mes 1..."
      },
      {
        "month": "Mes 2",
        "theme": "Encendemos la pauta",
        "whatWeWillDo": [
          "qué hace Altive este mes 1",
          "qué hace Altive 2",
          "qué hace Altive 3",
          "qué necesitamos de ${input.clientName}"
        ],
        "whatYouWillSee": "qué resultado visible percibe ${input.clientName} al terminar el mes 2..."
      },
      {
        "month": "Mes 3",
        "theme": "Optimizamos y escalamos",
        "whatWeWillDo": [
          "qué hace Altive este mes 1",
          "qué hace Altive 2",
          "qué hace Altive 3",
          "qué decidimos juntos este mes"
        ],
        "whatYouWillSee": "qué resultado visible percibe ${input.clientName} al terminar el mes 3..."
      }
    ],
    "quickWins": [
      {"action": "quick win 1 explicado en lenguaje simple para el cliente", "impact": "qué le aporta al negocio de ${input.clientName}..."},
      {"action": "quick win 2", "impact": "qué le aporta..."},
      {"action": "quick win 3", "impact": "qué le aporta..."}
    ],
    "yourRole": [
      "compromiso del cliente 1 explicado con amabilidad y claridad...",
      "compromiso del cliente 2...",
      "compromiso del cliente 3...",
      "compromiso del cliente 4..."
    ],
    "investment": [
      {"month": "Mes 1", "total": "inversión total del mes", "channels": "cómo se distribuye entre SEO, Meta Ads y Google Ads"},
      {"month": "Mes 2", "total": "inversión total del mes", "channels": "distribución"},
      {"month": "Mes 3", "total": "inversión total del mes", "channels": "distribución con posible escala"}
    ],
    "expectedResults": [
      {"metric": "resultado de negocio 1 (ej: nuevos pacientes/clientes)", "m1": "estimado mes 1", "m2": "estimado mes 2", "m3": "estimado mes 3"},
      {"metric": "resultado 2 (ej: visibilidad en Google)", "m1": "...", "m2": "...", "m3": "..."},
      {"metric": "resultado 3 (ej: mensajes por redes)", "m1": "...", "m2": "...", "m3": "..."},
      {"metric": "resultado 4 (ej: posición en buscadores)", "m1": "...", "m2": "...", "m3": "..."}
    ],
    "closing": "texto final motivador para ${input.clientName}: síntesis del potencial del trimestre, con qué resultados puede contar y por qué este es el momento indicado para actuar en ${input.city}..."
  }
}`;
}

// ─────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────
export async function generateRoadmapJson(
  input: AuditInput,
  marketResearchJson: any,
  auditJson: any,
  metaAdsJson: any,
  adsJson: any,
): Promise<any> {
  console.log('[roadmap] 1/2: roadmap agencia…');
  const agencyResult = await callClaude(
    SYSTEM_ROADMAP,
    buildRoadmapAgencyPrompt(input, marketResearchJson, auditJson, metaAdsJson, adsJson),
    16000,
  );

  console.log('[roadmap] 2/2: versión cliente…');
  const clientResult = await callClaude(
    SYSTEM_ROADMAP,
    buildRoadmapClientPrompt(input, agencyResult),
    10000,
  );

  return {
    meta: {
      clientName: input.clientName,
      city: input.city,
      date: 'Abril 2026',
    },
    agency: agencyResult,
    client: clientResult.client,
  };
}
