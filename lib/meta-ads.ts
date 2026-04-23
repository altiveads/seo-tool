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
  if (start === -1 || end === -1) throw new Error('No se encontró JSON en la respuesta de Claude (meta-ads).');
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
    throw new Error(`Respuesta truncada en meta-ads (max_tokens=${maxTokens}).`);
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
const SYSTEM_META = `Eres el Director de Estrategia de Meta Ads de ALTIVE, una agencia de marketing digital con metodología propia. Trabajas con estándares senior de planificación estratégica de pauta.

METODOLOGÍA ALTIVE — META ADS:
- Siempre: 1 campaña con 3 conjuntos de anuncios (Advantage+ directo, Advantage+ indirecto, Advantage+ IA de Meta)
- Siempre: 10 anuncios idénticos en los 3 conjuntos (mismos creativos y copies)
- La diferencia entre conjuntos está en la lógica de distribución, no en el contenido creativo
- Meta Ads es un vehículo de posicionamiento, filtrado y apertura de conversaciones valiosas
- Calidad del lead sobre volumen de mensajes

REGLAS ABSOLUTAS:
- Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después.
- Español colombiano profesional.
- HTML permitido solo en strings: <b>negrita</b> <i>cursiva</i>
- LÍMITES DE LONGITUD:
  * Campos "paragraphs": máximo 55 palabras por string
  * Campos "body" de anuncios: máximo 150 palabras
  * Campos "headline": máximo 10 palabras
  * Campos "description": máximo 30 palabras
  * Campos "callout": máximo 28 palabras
  * Campos "concept", "justification": máximo 25 palabras
- Cumple políticas de Meta: sin promesas absolutas, sin lenguaje discriminatorio.`;

// ─────────────────────────────────────────────────────────
// AGENCIA — Call 1/2
// ─────────────────────────────────────────────────────────
function buildMetaAdsAgencyPrompt(
  input: AuditInput,
  marketResearchJson: any,
  auditJson: any,
): string {
  const mrInsights = marketResearchJson?.agency?.strategicInsights?.slice(0, 3)
    .map((i: any) => i.insight).join('; ') || '';
  const mrGaps = marketResearchJson?.agency?.competitiveAnalysis?.gaps?.slice(0, 2).join('; ') || '';
  const auditDiagnosis = auditJson?.agency?.executiveSummary?.diagnosis || '';
  const auditKws = auditJson?.agency?.keywords?.transactional?.slice(0, 5)
    .map((k: any) => k.keyword).join(', ') || '';

  return `Construye la estrategia AGENCIA completa de Meta Ads para ${input.clientName} usando la metodología ALTIVE.

DATOS DEL NEGOCIO:
- Nombre: ${input.clientName}
- Tipo de negocio: ${input.businessType || '(no especificado)'}
- Sector: ${input.sector || '(no especificado)'}
- Ciudad y zona de pauta: ${input.geographicZone || input.city}
- Servicios principales: ${input.services || '(no especificado)'}
- Ticket promedio: ${input.ticketAverage || '(no especificado)'}
- Objetivo mensual: ${input.monthlyGoal || '(no especificado)'}
- Diferencial percibido: ${input.differentiator || '(no especificado)'}
- Presupuesto Meta Ads: ${input.metaAdsBudget || '(no especificado)'}
- Objetivo de campaña: ${input.campaignGoal || 'mensajes WhatsApp'}
- Público objetivo descrito: ${input.targetAudience || '(no especificado)'}

INSIGHTS DE INVESTIGACIÓN DE MERCADO:
${mrInsights || '(no disponible)'}

GAPS COMPETITIVOS DETECTADOS:
${mrGaps || '(no disponible)'}

DIAGNÓSTICO SEO:
${auditDiagnosis || '(no disponible)'}

KEYWORDS TRANSACCIONALES IDENTIFICADAS:
${auditKws || '(no disponible)'}

Devuelve EXACTAMENTE este JSON:

{
  "businessAnalysis": {
    "paragraphs": ["lectura estratégica del negocio de ${input.clientName}, su oferta real y posición en el mercado de ${input.city}...", "síntesis de los hallazgos de mercado más relevantes para orientar la pauta..."],
    "callout": "<b>Lectura estratégica.</b> lo que hace único a ${input.clientName} en el mercado y qué debe comunicar en Meta..."
  },
  "campaignObjective": {
    "strategic": "el objetivo estratégico real de la campaña (más allá de conseguir mensajes)...",
    "kpis": ["KPI primario: cuál es y por qué", "KPI secundario 1", "KPI secundario 2", "KPI de calidad 1"]
  },
  "idealClient": {
    "paragraphs": ["perfil psicológico del cliente ideal de ${input.clientName}, no solo demográfico..."],
    "desires": ["deseo profundo 1", "deseo 2", "deseo 3", "deseo 4"],
    "fears": ["miedo o freno 1", "miedo 2", "miedo 3"],
    "objections": ["objeción principal 1", "objeción 2", "objeción 3"],
    "activatingLanguage": ["frase que lo activa 1", "frase 2", "frase 3", "frase 4"]
  },
  "valueProposition": {
    "paragraphs": ["la promesa central que ${input.clientName} comunica en Meta Ads y cómo se traduce en la pauta..."],
    "promise": "la promesa en una oración directa para los anuncios...",
    "callout": "<b>Propuesta de valor.</b> qué ofrece ${input.clientName} que otros no dan en ${input.city}..."
  },
  "communicationAngle": {
    "angle": "dolor|deseo|oportunidad|autoridad|transformación|confianza|conveniencia|diferenciación|aspiración",
    "justification": "por qué este ángulo es el correcto para ${input.clientName} basado en el perfil del cliente y el mercado...",
    "callout": "<b>Ángulo elegido.</b> descripción del ángulo y cómo se aplica a ${input.clientName}..."
  },
  "adCopies": [
    {"number": 1, "angle": "nombre del ángulo de entrada", "body": "texto principal del anuncio con función comercial clara, máx 120 palabras...", "headline": "titular directo y con fuerza", "description": "descripción opcional del anuncio...", "cta": "CTA recomendado: Enviar mensaje|Más información|Reservar|Llamar ahora"},
    {"number": 2, "angle": "...", "body": "...", "headline": "...", "description": "...", "cta": "..."},
    {"number": 3, "angle": "...", "body": "...", "headline": "...", "description": "...", "cta": "..."},
    {"number": 4, "angle": "...", "body": "...", "headline": "...", "description": "...", "cta": "..."},
    {"number": 5, "angle": "...", "body": "...", "headline": "...", "description": "...", "cta": "..."},
    {"number": 6, "angle": "...", "body": "...", "headline": "...", "description": "...", "cta": "..."},
    {"number": 7, "angle": "...", "body": "...", "headline": "...", "description": "...", "cta": "..."},
    {"number": 8, "angle": "...", "body": "...", "headline": "...", "description": "...", "cta": "..."},
    {"number": 9, "angle": "...", "body": "...", "headline": "...", "description": "...", "cta": "..."},
    {"number": 10, "angle": "...", "body": "...", "headline": "...", "description": "...", "cta": "..."}
  ],
  "creativeBriefs": [
    {"number": 1, "type": "imagen estática|carrusel|video|reel", "concept": "concepto visual del anuncio...", "keyElements": ["elemento visual 1", "elemento 2", "elemento 3"], "emotionPalette": "emoción que debe transmitir la pieza..."},
    {"number": 2, "type": "...", "concept": "...", "keyElements": ["...", "...", "..."], "emotionPalette": "..."},
    {"number": 3, "type": "...", "concept": "...", "keyElements": ["...", "...", "..."], "emotionPalette": "..."},
    {"number": 4, "type": "...", "concept": "...", "keyElements": ["...", "...", "..."], "emotionPalette": "..."},
    {"number": 5, "type": "...", "concept": "...", "keyElements": ["...", "...", "..."], "emotionPalette": "..."},
    {"number": 6, "type": "...", "concept": "...", "keyElements": ["...", "...", "..."], "emotionPalette": "..."},
    {"number": 7, "type": "...", "concept": "...", "keyElements": ["...", "...", "..."], "emotionPalette": "..."},
    {"number": 8, "type": "...", "concept": "...", "keyElements": ["...", "...", "..."], "emotionPalette": "..."},
    {"number": 9, "type": "...", "concept": "...", "keyElements": ["...", "...", "..."], "emotionPalette": "..."},
    {"number": 10, "type": "...", "concept": "...", "keyElements": ["...", "...", "..."], "emotionPalette": "..."}
  ],
  "campaignStructure": {
    "campaignName": "nombre de la campaña para ${input.clientName}",
    "totalBudget": "${input.metaAdsBudget || 'definir con cliente'} / mes",
    "adsets": [
      {"name": "Conjunto 1 — Advantage+ directo", "logic": "descripción de la lógica de segmentación: quién tiene la relación más directa con la oferta y por qué...", "budget": "% o monto del presupuesto total"},
      {"name": "Conjunto 2 — Advantage+ indirecto", "logic": "descripción de la lógica: perfiles relacionados lateralmente con la oferta...", "budget": "% o monto"},
      {"name": "Conjunto 3 — Advantage+ IA de Meta", "logic": "descripción de la lógica algorítmica activa de Meta...", "budget": "% o monto"}
    ]
  },
  "conversionJourney": {
    "paragraphs": ["qué pasa después del clic o del mensaje y cómo se mueve el prospecto hacia la conversión..."],
    "steps": ["paso 1 del recorrido post-clic", "paso 2", "paso 3", "paso 4"],
    "commercialRecommendations": ["recomendación para la atención comercial 1", "recomendación 2", "recomendación 3"]
  },
  "successMetrics": [
    {"metric": "CPM (Costo por mil impresiones)", "primary": false, "benchmark": "rango referencial para ${input.sector || 'este sector'} en Colombia"},
    {"metric": "CTR (Click Through Rate)", "primary": false, "benchmark": "rango referencial..."},
    {"metric": "CPC (Costo por clic)", "primary": false, "benchmark": "rango referencial..."},
    {"metric": "CPL (Costo por lead/mensaje)", "primary": true, "benchmark": "umbral máximo aceptable dado el ticket de ${input.ticketAverage || 'el cliente'}"},
    {"metric": "Calidad del lead", "primary": true, "benchmark": "criterio de calificación del prospecto"},
    {"metric": "Tasa de respuesta comercial", "primary": true, "benchmark": "tiempo de respuesta ideal..."}
  ],
  "optimizationPlan": {
    "week1Signals": ["señal a evaluar en los primeros 7 días 1", "señal 2", "señal 3", "señal 4"],
    "decisionCriteria": ["criterio para ajustar 1: cuándo se cumple y qué se hace", "criterio 2", "criterio 3"],
    "doNotTouch": ["qué NO tocar en la fase inicial 1", "qué no tocar 2", "qué no tocar 3"]
  }
}

MÍNIMOS: adCopies: exactamente 10 | creativeBriefs: exactamente 10 | campaignStructure.adsets: exactamente 3 | successMetrics: 6 | idealClient.desires: 4`;
}

// ─────────────────────────────────────────────────────────
// CLIENTE — Call 2/2
// ─────────────────────────────────────────────────────────
function buildMetaAdsClientPrompt(input: AuditInput, agencyData: any): string {
  const angle = agencyData?.communicationAngle?.angle || '';
  const budget = agencyData?.campaignStructure?.totalBudget || input.metaAdsBudget || '(a definir)';
  const topCopies = agencyData?.adCopies?.slice(0, 3)
    .map((c: any) => `"${c.headline}"`)
    .join(', ') || '';

  return `Genera el informe CLIENTE de Meta Ads para ${input.clientName}. Tono: simple, aliado, sin jerga técnica. Como si se lo explicaras en una reunión.

CLIENTE: ${input.clientName} | ${input.city}
PRESUPUESTO: ${budget}
ÁNGULO ELEGIDO: ${angle}
TITULARES DE EJEMPLO: ${topCopies}

Devuelve EXACTAMENTE este JSON (con la clave "client"):

{
  "client": {
    "cover": {
      "title": "Cómo vamos a llegar a más personas en redes",
      "subtitle": "${input.clientName} — Estrategia de publicidad en Meta (Facebook e Instagram)"
    },
    "theIdea": "explicación en lenguaje de negocio (3-4 oraciones) de qué vamos a hacer en Meta Ads para ${input.clientName} en ${input.city}. Sin jerga técnica...",
    "howItWorks": {
      "paragraphs": ["cómo funciona la publicidad en Facebook e Instagram para un negocio como ${input.clientName}..."],
      "steps": ["paso 1: cómo ve el anuncio la persona indicada...", "paso 2: qué pasa cuando hace clic...", "paso 3: cómo llega a ${input.clientName}...", "paso 4: cómo se convierte en cliente..."]
    },
    "adExamples": [
      {"headline": "titular ejemplo 1 (real del copy 1)", "body": "primeras 2-3 oraciones del body del copy 1...", "cta": "botón de acción"},
      {"headline": "titular ejemplo 2", "body": "primeras oraciones del copy 2...", "cta": "botón"},
      {"headline": "titular ejemplo 3", "body": "primeras oraciones del copy 3...", "cta": "botón"}
    ],
    "investment": {
      "amount": "${budget}",
      "distribution": ["Conjunto 1: descripción simple de a quién le llega...", "Conjunto 2: descripción simple...", "Conjunto 3: descripción simple..."]
    },
    "expectedResults": {
      "paragraphs": ["qué puede esperar ${input.clientName} de la pauta en Meta en términos de negocio, no métricas..."],
      "metrics": [
        {"metric": "Personas alcanzadas / mes", "description": "estimado de cuántas personas verán los anuncios..."},
        {"metric": "Mensajes o contactos generados", "description": "estimado de prospectos por mes..."},
        {"metric": "Costo por prospecto", "description": "rango estimado dado el presupuesto y el sector..."},
        {"metric": "Calidad del prospecto", "description": "qué tipo de persona generamos: lista para decidir vs. solo curiosa..."}
      ]
    },
    "whatWeNeedFromYou": [
      "<b>Aprobar el presupuesto:</b> definir el monto mensual para empezar.",
      "<b>Fotos y videos del negocio:</b> material real del consultorio/local/equipo.",
      "<b>Número de WhatsApp activo:</b> para recibir los mensajes de los prospectos.",
      "<b>Disponibilidad comercial:</b> alguien que responda rápido (menos de 30 min idealmente).",
      "<b>Revisión de los anuncios:</b> leer y aprobar los textos antes de publicar."
    ],
    "ourCommitment": [
      "Activamos los anuncios solo cuando todo esté revisado y aprobado.",
      "Compartimos resultados cada semana: alcance, mensajes y costo por contacto.",
      "Optimizamos continuamente basándonos en los datos reales de rendimiento.",
      "Si un anuncio no está funcionando, lo pausamos y probamos una alternativa.",
      "Nunca gastamos más del presupuesto acordado sin avisarte primero."
    ],
    "closing": "<b>¿Empezamos?</b> texto final motivador y específico para ${input.clientName}: qué oportunidad se está perdiendo cada día sin publicidad activa y qué podemos lograr juntos en ${input.city}..."
  }
}`;
}

// ─────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────
export async function generateMetaAdsJson(
  input: AuditInput,
  marketResearchJson: any,
  auditJson: any,
): Promise<any> {
  console.log('[meta-ads] 1/2: estrategia agencia…');
  const agencyResult = await callClaude(
    SYSTEM_META,
    buildMetaAdsAgencyPrompt(input, marketResearchJson, auditJson),
    16000,
  );

  console.log('[meta-ads] 2/2: presentación cliente…');
  const clientResult = await callClaude(
    SYSTEM_META,
    buildMetaAdsClientPrompt(input, agencyResult),
    10000,
  );

  return {
    meta: {
      clientName: input.clientName,
      city: input.city,
      budget: input.metaAdsBudget || '',
      date: 'Abril 2026',
    },
    agency: agencyResult,
    client: clientResult.client,
  };
}
