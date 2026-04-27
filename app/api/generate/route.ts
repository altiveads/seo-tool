import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createJob } from '@/lib/jobs';
import { runPipeline } from '@/lib/pipeline';

const schema = z.object({
  // Sección 1 — Datos del cliente
  websiteUrl: z.string().url('URL inválida'),
  clientName: z.string().min(1, 'Nombre requerido'),
  city: z.string().min(1, 'Ciudad requerida'),
  country: z.string().default('Colombia'),
  businessType: z.string().optional(),
  sector: z.string().optional(),
  services: z.string().optional(),
  businessDescription: z.string().optional(),

  // Sección 2 — Datos comerciales
  ticketAverage: z.string().optional(),
  monthlyGoal: z.string().optional(),
  differentiator: z.string().optional(),
  knownCompetitors: z.string().optional(),

  // Sección 3 — Datos de pauta
  metaAdsBudget: z.string().optional(),
  monthlyBudgetCOP: z.number().positive().optional(),
  campaignGoal: z.enum(['whatsapp', 'calls', 'form', 'visits']).optional(),
  targetAudience: z.string().optional(),
  geographicZone: z.string().optional(),

  // Sección 4 — Contexto adicional
  socialMedia: z.string().optional(),
  internalNotes: z.string().optional(),

  // Opciones heredadas
  objectives: z.array(z.string()).min(1).default(['traffic']),
  customObjective: z.string().optional(),
  competitors: z.array(z.string()).default([]),
  includeKeywordsInStrategyPdf: z.boolean().default(true),
  generateKeywords: z.boolean().default(true),

  // Configuración avanzada
  apiKey: z.string().optional(),
  selectedModules: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = schema.parse(body);

    const job = createJob(input as any);

    // Corre el pipeline en background sin bloquear la respuesta HTTP
    setImmediate(() => runPipeline(job.id, input as any));

    return NextResponse.json({ jobId: job.id }, { status: 202 });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: err.errors },
        { status: 422 },
      );
    }
    console.error('[/api/generate]', err);
    return NextResponse.json(
      { error: err?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}
