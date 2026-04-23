'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { JobState } from '@/lib/types';

const STEP_LABELS: Record<string, string> = {
  queued:           'En cola',
  market_research:  'Investigando el mercado…',
  scraping:         'Analizando el sitio web…',
  keywords:         'Expandiendo keywords…',
  analyzing:        'Generando contenido con IA…',
  meta_ads:         'Construyendo estrategia Meta Ads…',
  roadmap:          'Generando roadmap integrado…',
  generating_pdfs:  'Renderizando PDFs…',
  done:             '¡Listo!',
  error:            'Error',
};

const PDF_LABELS: Record<string, { label: string; desc: string; icon: string }> = {
  'market-research-agencia': {
    label: 'Market Research — Agencia',
    desc: 'Análisis completo de mercado, demanda y competencia',
    icon: '🔬',
  },
  'market-research-cliente': {
    label: 'Market Research — Cliente',
    desc: 'Visión del mercado para tomar mejores decisiones',
    icon: '📊',
  },
  'auditoria-seo-agencia': {
    label: 'Auditoría SEO — Agencia',
    desc: 'Informe técnico completo para uso interno',
    icon: '🔍',
  },
  'auditoria-seo-cliente': {
    label: 'Auditoría SEO — Cliente',
    desc: 'Diagnóstico digital en lenguaje sencillo',
    icon: '📄',
  },
  'meta-ads-agencia': {
    label: 'Estrategia Meta Ads — Agencia',
    desc: '10 copies, briefs creativos y estructura de campañas',
    icon: '📱',
  },
  'meta-ads-cliente': {
    label: 'Meta Ads — Cliente',
    desc: 'Explicación del plan de pauta en redes sociales',
    icon: '📣',
  },
  'google-ads-agencia': {
    label: 'Estrategia Google Ads — Agencia',
    desc: 'Campañas, keywords, ad copy y medición',
    icon: '⚙️',
  },
  'google-ads-cliente': {
    label: 'Google Ads — Cliente',
    desc: 'Plan de publicidad en Google en lenguaje simple',
    icon: '🎯',
  },
  'roadmap-agencia': {
    label: 'Roadmap Integrado — Agencia',
    desc: 'Plan de 3 meses con semanas, acciones y KPIs',
    icon: '🗺️',
  },
  'roadmap-cliente': {
    label: 'Roadmap — Cliente',
    desc: 'Tu plan de crecimiento digital del próximo trimestre',
    icon: '🚀',
  },
};

export default function JobStatus({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobState | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: JobState = await res.json();
        if (active) setJob(data);
        if (active && data.status !== 'done' && data.status !== 'error') {
          setTimeout(poll, 2500);
        }
      } catch (e: any) {
        if (active) setErr(e?.message ?? 'Error al consultar el estado.');
      }
    }

    poll();
    return () => { active = false; };
  }, [jobId]);

  if (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <strong>Error de conexión:</strong> {err}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center gap-3 text-slate-500">
        <Spinner /> Conectando…
      </div>
    );
  }

  const isDone = job.status === 'done';
  const isError = job.status === 'error';

  return (
    <div className="space-y-6">
      {/* BARRA DE PROGRESO */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">
            {STEP_LABELS[job.status] ?? job.step}
          </span>
          <span className={clsx(
            'text-sm font-bold',
            isDone ? 'text-green-600' : isError ? 'text-red-500' : 'text-altive-600',
          )}>
            {job.progress}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-700',
              isDone ? 'bg-green-500' : isError ? 'bg-red-400' : 'bg-altive-500',
            )}
            style={{ width: `${job.progress}%` }}
          />
        </div>
        {!isDone && !isError && (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Spinner /> {job.step}
          </p>
        )}
        {isError && (
          <p className="mt-3 text-sm text-red-600">
            ❌ {job.error ?? 'Ocurrió un error inesperado.'}
          </p>
        )}
      </div>

      {/* DESCARGAS */}
      {isDone && job.files && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="mb-5 text-base font-bold text-green-800">
            ✅ Los 10 PDFs están listos
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.keys(PDF_LABELS).map((key) => {
              const meta = PDF_LABELS[key];
              const available = !!(job.files as Record<string, unknown>)[key];
              if (!available) return null;
              return (
                <a
                  key={key}
                  href={`/api/jobs/${jobId}/download/${key}`}
                  download
                  className="flex items-start gap-3 rounded-lg border border-green-200 bg-white p-4 shadow-sm transition-all hover:border-altive-400 hover:shadow-md"
                >
                  <span className="text-2xl leading-none">{meta.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{meta.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{meta.desc}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-altive-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}
