import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { getJob } from '@/lib/jobs';

const FILE_NAMES: Record<string, string> = {
  'auditoria-seo-agencia': 'Auditoria_SEO_Agencia.pdf',
  'auditoria-seo-cliente': 'Auditoria_SEO_Cliente.pdf',
  'google-ads-agencia': 'Google_Ads_Estrategia_Agencia.pdf',
  'google-ads-cliente': 'Google_Ads_Cliente.pdf',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; key: string }> },
) {
  const { id, key } = await params;
  const job = getJob(id);

  if (!job) {
    return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 });
  }

  if (job.status !== 'done' || !job.files) {
    return NextResponse.json(
      { error: 'Los archivos aún no están listos' },
      { status: 409 },
    );
  }

  const filePath = job.files[key];
  if (!filePath) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const filename = FILE_NAMES[key] ?? `${key}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo leer el archivo' },
      { status: 500 },
    );
  }
}
