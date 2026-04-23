import JobStatus from '@/components/JobStatus';
import Link from 'next/link';

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-altive-600"
      >
        ← Nueva auditoría
      </Link>

      <h1 className="text-2xl font-bold text-altive-700 mb-2">
        Generando tu informe…
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Job ID:{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{id}</code>
        <br />
        No cierres esta pestaña. Cuando termine, aparecerán los botones de descarga.
      </p>

      <JobStatus jobId={id} />
    </div>
  );
}
