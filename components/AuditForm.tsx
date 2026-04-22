'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const OBJECTIVES = [
  { value: 'traffic', label: '🚀 Tráfico masivo' },
  { value: 'leads', label: '🎯 Conseguir leads' },
  { value: 'brand', label: '🏷️ Posicionar marca' },
  { value: 'conversions', label: '💰 Conversiones / ventas' },
  { value: 'retargeting', label: '🔄 Retargeting / remarketing' },
];

export default function AuditForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    websiteUrl: '',
    clientName: '',
    city: '',
    country: 'Colombia',
    monthlyBudgetCOP: '',
    objectives: [] as string[],
    customObjective: '',
    competitors: '',
    includeKeywordsInStrategyPdf: true,
    generateKeywords: true,
  });

  function toggleObjective(val: string) {
    setForm((prev) => ({
      ...prev,
      objectives: prev.objectives.includes(val)
        ? prev.objectives.filter((o) => o !== val)
        : [...prev.objectives, val],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.websiteUrl || !form.clientName || !form.city) {
      setError('URL, nombre del cliente y ciudad son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const body = {
        ...form,
        monthlyBudgetCOP: form.monthlyBudgetCOP
          ? parseInt(form.monthlyBudgetCOP.replace(/\D/g, ''), 10)
          : undefined,
        competitors: form.competitors
          ? form.competitors.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
        objectives: form.objectives.length ? form.objectives : ['traffic'],
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Error ${res.status}`);
      }

      const { jobId } = await res.json();
      router.push(`/job/${jobId}`);
    } catch (err: any) {
      setError(err?.message ?? 'Error inesperado. Revisa la consola.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* DATOS DEL CLIENTE */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-bold text-altive-700">
          Datos del cliente
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Nombre del cliente *</label>
            <input
              className="field-input"
              placeholder="Ej: Vera Oftalmología"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label">URL del sitio web *</label>
            <input
              className="field-input"
              type="url"
              placeholder="https://ejemplo.com"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label">Ciudad *</label>
            <input
              className="field-input"
              placeholder="Ej: Medellín"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label">País</label>
            <input
              className="field-input"
              placeholder="Colombia"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* PRESUPUESTO + COMPETIDORES */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-bold text-altive-700">
          Publicidad y competencia
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">
              Presupuesto mensual Google Ads (COP)
            </label>
            <input
              className="field-input"
              placeholder="Ej: 6000000"
              value={form.monthlyBudgetCOP}
              onChange={(e) =>
                setForm({ ...form, monthlyBudgetCOP: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-slate-400">
              Deja vacío para que la estrategia proponga 3 escenarios.
            </p>
          </div>
          <div>
            <label className="field-label">
              Competidores (opcional, separados por coma)
            </label>
            <input
              className="field-input"
              placeholder="Ej: clinicaX.com, clinicaY.com"
              value={form.competitors}
              onChange={(e) =>
                setForm({ ...form, competitors: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-slate-400">
              Si no escribes ninguno, la IA los detecta automáticamente.
            </p>
          </div>
        </div>
      </section>

      {/* OBJETIVOS */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-base font-bold text-altive-700">
          Objetivos de la publicidad
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Selecciona todos los que apliquen. Esto guía tanto la auditoría SEO como la estrategia de Ads.
        </p>
        <div className="flex flex-wrap gap-3">
          {OBJECTIVES.map((obj) => (
            <button
              key={obj.value}
              type="button"
              onClick={() => toggleObjective(obj.value)}
              className={clsx(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                form.objectives.includes(obj.value)
                  ? 'border-altive-500 bg-altive-500 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-altive-300',
              )}
            >
              {obj.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="field-label">Objetivo personalizado (opcional)</label>
          <input
            className="field-input"
            placeholder="Ej: Quiero que vengan más pacientes de estratos 4-6"
            value={form.customObjective}
            onChange={(e) =>
              setForm({ ...form, customObjective: e.target.value })
            }
          />
        </div>
      </section>

      {/* OPCIONES DE GENERACIÓN */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-bold text-altive-700">
          Opciones de los PDFs
        </h2>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-4">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-altive-500"
              checked={form.generateKeywords}
              onChange={(e) =>
                setForm({ ...form, generateKeywords: e.target.checked })
              }
            />
            <div>
              <div className="font-medium text-slate-800">
                Generar keywords basadas en la estrategia
              </div>
              <div className="text-sm text-slate-500">
                Claude investigará y clasificará las palabras clave por campaña (Síntomas / Servicios / Marca) usando autocompletado de Google + análisis semántico.
              </div>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-4">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-altive-500"
              checked={form.includeKeywordsInStrategyPdf}
              onChange={(e) =>
                setForm({
                  ...form,
                  includeKeywordsInStrategyPdf: e.target.checked,
                })
              }
            />
            <div>
              <div className="font-medium text-slate-800">
                Incluir keywords completas en el PDF de estrategia (agencia)
              </div>
              <div className="text-sm text-slate-500">
                Si está activo, el PDF de Ads para agencia incluye todas las keywords de cada grupo de anuncios. Si está desactivo, solo muestra ejemplos.
              </div>
            </div>
          </label>
        </div>
      </section>

      {/* RESUMEN + CTA */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-altive-100 bg-altive-50 px-6 py-4">
        <div>
          <div className="text-sm font-semibold text-altive-700">
            Se generarán 4 PDFs
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Auditoría SEO (agencia + cliente) · Estrategia Google Ads (agencia + cliente)
          </div>
          <div className="text-xs text-slate-400 mt-1">
            ⏱ Tiempo estimado: 60–120 segundos
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={clsx(
            'rounded-lg px-6 py-3 text-sm font-bold text-white transition-all',
            loading
              ? 'cursor-not-allowed bg-slate-300'
              : 'bg-altive-700 shadow-md hover:bg-altive-600 active:scale-95',
          )}
        >
          {loading ? 'Iniciando...' : '🚀 Generar auditoría'}
        </button>
      </div>
    </form>
  );
}
