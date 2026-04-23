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
  if (start === -1 || end === -1) throw new Error('No se encontró JSON en la respuesta de Claude (market-research).');
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
    throw new Error(`Respuesta truncada en market-research (max_tokens=${maxTokens}).`);
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
const SYSTEM_MR = `Eres un Director Senior de Market Intelligence con estándares de consultoría de primer nivel. Trabajas para la agencia Altive.

REGLAS ABSOLUTAS:
- Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después.
- Español colombiano profesional.
- HTML permitido solo en strings: <b>negrita</b> <i>cursiva</i>
- LÍMITES DE LONGITUD:
  * Campos "paragraphs": cada string máximo 55 palabras
  * Campos "finding", "insight", "recommendation": máximo 20 palabras
  * Campos "evidence", "implication", "why": máximo 18 palabras
  * Campos "callout": máximo 28 palabras
  * Campos "trend", "driver", "barrier": máximo 15 palabras
- Separa hechos de inferencias. Si no puedes confirmar algo, anota "(inferido del sector)".
- No inventes datos específicos: usa rangos y estimados razonables del sector.
- Estándar ejecutivo: claridad, profundidad, accionabilidad.`;

// ─────────────────────────────────────────────────────────
// AGENCIA — Call 1/2: investigación completa
// ─────────────────────────────────────────────────────────
function buildMrAgencyPrompt(input: AuditInput): string {
  const competitors = input.knownCompetitors || input.competitors?.join(', ') || 'detectar del sector';

  return `Ejecuta la investigación de mercado AGENCIA para el siguiente cliente. Devuelve ÚNICAMENTE el JSON indicado.

DATOS DEL NEGOCIO:
- Nombre: ${input.clientName}
- Sitio web: ${input.websiteUrl}
- Tipo de negocio: ${input.businessType || '(no especificado)'}
- Sector: ${input.sector || '(no especificado)'}
- Ciudad: ${input.city}, ${input.country}
- Servicios principales: ${input.services || '(no especificado)'}
- Descripción: ${input.businessDescription || '(no especificado)'}
- Ticket promedio: ${input.ticketAverage || '(no especificado)'}
- Objetivo mensual: ${input.monthlyGoal || '(no especificado)'}
- Diferencial percibido: ${input.differentiator || '(no especificado)'}
- Competidores conocidos: ${competitors}
- Redes sociales: ${input.socialMedia || '(no especificado)'}
- Notas internas: ${input.internalNotes || 'ninguna'}

Devuelve EXACTAMENTE este JSON:

{
  "executiveSummary": {
    "paragraphs": ["diagnóstico conciso del mercado y la oportunidad principal para ${input.clientName}...", "qué implica para el negocio y la urgencia de actuar..."],
    "keyFindings": ["hallazgo estratégico 1", "hallazgo estratégico 2", "hallazgo 3", "hallazgo 4", "hallazgo 5"],
    "callout": "<b>Hallazgo central.</b> insight más importante del mercado para ${input.clientName}..."
  },
  "businessContext": {
    "paragraphs": ["descripción del negocio de ${input.clientName}, su posición actual y el problema de negocio que esta investigación soporta..."],
    "problemStatement": "el problema de negocio concreto que esta investigación ayuda a resolver..."
  },
  "methodology": {
    "general": "objetivo general de la investigación en una oración...",
    "specific": ["objetivo específico 1", "objetivo específico 2", "objetivo específico 3"],
    "questions": ["pregunta de investigación 1?", "pregunta 2?", "pregunta 3?"],
    "scope": ["qué incluye la investigación 1", "qué incluye 2", "qué excluye 1"],
    "limitations": ["limitación metodológica 1", "limitación 2", "limitación 3"]
  },
  "marketAnalysis": {
    "paragraphs": ["análisis del tamaño y dinámica del mercado de ${input.sector || 'este sector'} en ${input.city}...", "evolución reciente y perspectivas del mercado..."],
    "size": "estimado del tamaño del mercado local en ${input.city} para el sector...",
    "trends": [
      {"trend": "tendencia 1 del mercado", "impact": "Alta|Media|Baja"},
      {"trend": "tendencia 2", "impact": "Alta|Media|Baja"},
      {"trend": "tendencia 3", "impact": "Alta|Media|Baja"},
      {"trend": "tendencia 4", "impact": "Alta|Media|Baja"},
      {"trend": "tendencia 5", "impact": "Alta|Media|Baja"}
    ],
    "drivers": ["driver de crecimiento 1", "driver 2", "driver 3", "driver 4"],
    "barriers": ["barrera de entrada 1", "barrera 2", "barrera 3"],
    "callout": "<b>Dinámica clave.</b> la fuerza más relevante que moldea este mercado en ${input.city}..."
  },
  "demandAnalysis": {
    "paragraphs": ["análisis del comportamiento del consumidor en el mercado de ${input.clientName}...", "cómo toman decisiones, qué los mueve, qué los frena..."],
    "segments": [
      {"name": "segmento 1", "needs": "qué necesita este segmento", "urgency": "Alta|Media|Baja"},
      {"name": "segmento 2", "needs": "qué necesita", "urgency": "Alta|Media|Baja"},
      {"name": "segmento 3", "needs": "qué necesita", "urgency": "Alta|Media|Baja"}
    ],
    "motivations": ["motivación de compra 1", "motivación 2", "motivación 3", "motivación 4"],
    "fears": ["miedo o barrera 1", "miedo 2", "miedo 3"],
    "decisionCriteria": ["criterio de decisión 1", "criterio 2", "criterio 3", "criterio 4"],
    "callout": "<b>Driver emocional.</b> la emoción o tensión central que impulsa la decisión de compra en este sector..."
  },
  "competitiveAnalysis": {
    "paragraphs": ["lectura del panorama competitivo en ${input.city} para ${input.clientName}...", "cómo se distribuyen los players y qué posicionamientos dominan..."],
    "competitors": [
      {"name": "competidor 1", "positioning": "cómo se posiciona", "offer": "qué ofrece", "strength": "su fortaleza clave", "weakness": "su debilidad", "threat": "Alta|Media|Baja"},
      {"name": "competidor 2", "positioning": "...", "offer": "...", "strength": "...", "weakness": "...", "threat": "Alta|Media|Baja"},
      {"name": "competidor 3", "positioning": "...", "offer": "...", "strength": "...", "weakness": "...", "threat": "Alta|Media|Baja"},
      {"name": "competidor 4", "positioning": "...", "offer": "...", "strength": "...", "weakness": "...", "threat": "Alta|Media|Baja"},
      {"name": "competidor 5", "positioning": "...", "offer": "...", "strength": "...", "weakness": "...", "threat": "Alta|Media|Baja"}
    ],
    "gaps": ["espacio desatendido en el mercado 1", "gap 2", "gap 3", "oportunidad de diferenciación 1"],
    "callout": "<b>Espacio de oportunidad.</b> el gap más relevante que ${input.clientName} puede ocupar en el mercado..."
  },
  "keyFindings": [
    {"finding": "hallazgo concreto 1", "evidence": "qué lo respalda", "implication": "qué implica para el negocio"},
    {"finding": "hallazgo 2", "evidence": "evidencia", "implication": "implicación"},
    {"finding": "hallazgo 3", "evidence": "evidencia", "implication": "implicación"},
    {"finding": "hallazgo 4", "evidence": "evidencia", "implication": "implicación"},
    {"finding": "hallazgo 5", "evidence": "evidencia", "implication": "implicación"},
    {"finding": "hallazgo 6", "evidence": "evidencia", "implication": "implicación"}
  ],
  "strategicInsights": [
    {"insight": "insight estratégico 1", "type": "tensión de mercado|oportunidad|driver emocional|barrera invisible|error competitivo|ventaja explotable", "implication": "qué hacer con este insight"},
    {"insight": "insight 2", "type": "...", "implication": "..."},
    {"insight": "insight 3", "type": "...", "implication": "..."},
    {"insight": "insight 4", "type": "...", "implication": "..."},
    {"insight": "insight 5", "type": "...", "implication": "..."}
  ],
  "recommendations": [
    {"recommendation": "recomendación concreta 1", "type": "estratégica|táctica|posicionamiento|oferta|comunicación|canal", "why": "por qué ahora", "impact": "qué resultado esperado", "priority": "Alta|Media|Baja", "risk": "riesgo o condición"},
    {"recommendation": "recomendación 2", "type": "...", "why": "...", "impact": "...", "priority": "Alta", "risk": "..."},
    {"recommendation": "recomendación 3", "type": "...", "why": "...", "impact": "...", "priority": "Alta", "risk": "..."},
    {"recommendation": "recomendación 4", "type": "...", "why": "...", "impact": "...", "priority": "Media", "risk": "..."},
    {"recommendation": "recomendación 5", "type": "...", "why": "...", "impact": "...", "priority": "Media", "risk": "..."},
    {"recommendation": "recomendación 6", "type": "...", "why": "...", "impact": "...", "priority": "Baja", "risk": "..."}
  ],
  "nextSteps": ["próximo paso operativo 1", "próximo paso 2", "próximo paso 3", "próximo paso 4"]
}

MÍNIMOS: executiveSummary.keyFindings: 5 | marketAnalysis.trends: 5 | competitiveAnalysis.competitors: 5 | keyFindings: 6 | strategicInsights: 5 | recommendations: 6`;
}

// ─────────────────────────────────────────────────────────
// CLIENTE — Call 2/2: versión simplificada
// ─────────────────────────────────────────────────────────
function buildMrClientPrompt(input: AuditInput, agencyData: any): string {
  const topInsight = agencyData?.strategicInsights?.[0]?.insight || '';
  const topRec = agencyData?.recommendations?.slice(0, 3).map((r: any) => r.recommendation).join('; ') || '';
  const gaps = agencyData?.competitiveAnalysis?.gaps?.slice(0, 2).join('; ') || '';

  return `Genera el informe CLIENTE de investigación de mercado para ${input.clientName}. Tono: claro, inspirador, sin jerga de consultoría. Como si lo explicaras en una reunión al empresario.

CLIENTE: ${input.clientName} | ${input.city} | ${input.sector || 'su sector'}
INSIGHT CENTRAL: ${topInsight}
OPORTUNIDADES DETECTADAS: ${gaps}
RECOMENDACIONES TOP: ${topRec}

Devuelve EXACTAMENTE este JSON (con la clave "client"):

{
  "client": {
    "cover": {
      "title": "Tu mercado hoy",
      "subtitle": "Lo que encontramos al investigar tu sector en ${input.city}",
      "tagline": "Una visión honesta del mercado para tomar mejores decisiones."
    },
    "intro": {
      "paragraphs": ["qué hicimos: investigamos el mercado de ${input.sector || 'tu sector'} en ${input.city} para ${input.clientName}...", "para qué sirve este documento: qué decisiones te ayuda a tomar..."],
      "callout": "<b>La conclusión en una frase.</b> el hallazgo más valioso para ${input.clientName}: síntesis del estado del mercado y la oportunidad central..."
    },
    "marketOpportunity": {
      "title": "¿Qué tan grande es la oportunidad?",
      "paragraphs": ["descripción accesible del tamaño y la dinámica del mercado en ${input.city}..."],
      "items": [
        {"title": "señal de oportunidad 1", "description": "qué significa esto para ${input.clientName} en términos de negocio..."},
        {"title": "señal de oportunidad 2", "description": "qué significa..."},
        {"title": "señal de oportunidad 3", "description": "qué significa..."},
        {"title": "señal de oportunidad 4", "description": "qué significa..."}
      ]
    },
    "yourPosition": {
      "title": "¿Dónde estás parado?",
      "paragraphs": ["lectura honesta de la posición de ${input.clientName} en el mercado actual..."],
      "strengths": ["fortaleza real de ${input.clientName} en este mercado 1", "fortaleza 2", "fortaleza 3"],
      "opportunities": ["oportunidad concreta para explotar 1", "oportunidad 2", "oportunidad 3"]
    },
    "topRecommendations": {
      "title": "Las 3 jugadas más importantes",
      "items": [
        {"title": "nombre de la jugada 1", "why": "por qué esta jugada importa para ${input.clientName} y qué resultado esperado tiene...", "priority": "Alta"},
        {"title": "jugada 2", "why": "por qué importa...", "priority": "Alta"},
        {"title": "jugada 3", "why": "por qué importa...", "priority": "Media"}
      ]
    },
    "closing": {
      "paragraphs": ["síntesis de la oportunidad de ${input.clientName} en el mercado de ${input.city}...", "el potencial concreto si actúa sobre los hallazgos de esta investigación..."],
      "callout": "<b>Próximo paso.</b> acción concreta e inmediata que ${input.clientName} puede tomar basada en esta investigación..."
    }
  }
}`;
}

// ─────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────
export async function generateMarketResearchJson(input: AuditInput): Promise<any> {
  console.log('[market-research] 1/2: investigación agencia…');
  const agencyResult = await callClaude(SYSTEM_MR, buildMrAgencyPrompt(input), 16000);

  console.log('[market-research] 2/2: versión cliente…');
  const clientResult = await callClaude(SYSTEM_MR, buildMrClientPrompt(input, agencyResult), 10000);

  return {
    meta: {
      clientName: input.clientName,
      city: input.city,
      sector: input.sector || '',
      date: 'Abril 2026',
    },
    agency: agencyResult,
    client: clientResult.client,
  };
}
