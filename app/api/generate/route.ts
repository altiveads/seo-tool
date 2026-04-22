import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createJob } from '@/lib/jobs';
import { runPipeline } from '@/lib/pipeline';

const schema = z.object({
  websiteUrl: z.string().url('URL inválida'),
  clientName: z.string().min(1, 'Nombre requerido'),
  city: z.string().min(1, 'Ciudad requerida'),
  country: z.string().default('Colombia'),
  monthlyBudgetCOP: z.number().positive().optional(),
  objectives: z.array(z.string()).min(1).default(['traffic']),
  customObjective: z.string().optional(),
  competitors: z.array(z.string()).default([]),
  includeKeywordsInStrategyPdf: z.boolean().default(true),
  generateKeywords: z.boolean().default(true),
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
