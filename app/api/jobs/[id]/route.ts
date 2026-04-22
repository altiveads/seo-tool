import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const job = getJob(params.id);

  if (!job) {
    return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 });
  }

  // No exponemos las rutas absolutas al cliente — solo los keys disponibles
  const safeJob = {
    id: job.id,
    status: job.status,
    progress: job.progress,
    step: job.step,
    error: job.error,
    files: job.files ? Object.fromEntries(
      Object.keys(job.files).map((k) => [k, true])
    ) : undefined,
  };

  return NextResponse.json(safeJob);
}
