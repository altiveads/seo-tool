'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const SECTORS = [
  'Salud', 'Estética', 'Legal', 'Financiero', 'Educación',
  'Inmobiliario', 'Retail', 'Tecnología', 'Gastronomía', 'Otro',
];

const CAMPAIGN_GOALS = [
  { value: 'whatsapp', label: '💬 Mensajes WhatsApp' },
  { value: 'calls',    label: '📞 Llamadas telefónicas' },
  { value: 'form',     label: '📋 Formulario de contacto' },
  { value: 'visits',   label: '🌐 Visitas al sitio web' },
];

const OBJECTIVES = [
  { value: 'traffic',     label: '🚀 Tráfico masivo' },
  { value: 'leads',       label: '🎯 Conseguir leads' },
  { value: 'brand',       label: '🏷️ Posicionar marca' },
  { value: 'conversions', label: '💰 Conversiones / ventas' },
  { value: 'retargeting', label: '🔄 Retargeting / remarketing' },
];

const MODULES = [
  {
    value: 'market-research',
    label: '🔍 Market Research',
    desc: 'Análisis del mercado, tendencias, competidores y oportunidades',
    color: 'border-purple-200 bg-purple-50',
    activeColor: 'border-purple-500 bg-purple-500',
  },
  {
    value: 'seo-audit',
    label: '🌐 Auditoría SEO',
    desc: 'Análisis del sitio web, palabras clave y estrategia de posicionamiento',
    color: 'border-blue-200 bg-blue-50',
    activeColor: 'border-blue-500 bg-blue-500',
  },
  {
    value: 'meta-ads',
    label: '📱 Meta Ads',
    desc: 'Estrategia de campaña Meta Ads con metodología ALTIVE (3 adsets, 10 anuncios)',
    color: 'border-sky-200 bg-sky-50',
    activeColor: 'border-sky-500 bg-sky-500',
  },
  {
    value: 'google-ads',
    label: '🎯 Google Ads',
    desc: 'Estrategia completa de Google Ads con grupos, copies y presupuesto',
    color: 'border-green-200 bg-green-50',
    activeColor: 'border-green-500 bg-green-500',
  },
  {
    value: 'roadmap',
    label: '🗺️ Roadmap',
    desc: 'Plan integrado de los 3 próximos meses con semanas, acciones y KPIs',
    color: 'border-orange-200 bg-orange-50',
    activeColor: 'border-orange-500 bg-orange-500',
  },
];

type FormState = {
  // Config
  apiKey: string;
  selectedModules: string[];
  // Sección 1 — Datos del cliente
  websiteUrl: string;
  clientName: string;
  city: string;
  country: string;
  businessType: string;
  sector: string;
  services: string;
  businessDescription: string;
  // Sección 2 — Datos comerciales
  ticketAverage: string;
  monthlyGoal: string;
  differentiator: string;
  knownCompetitors: string;
  // Sección 3 — Datos de pauta
  metaAdsBudget: string;
  monthlyBudgetCOP: string;
  campaignGoal: string;
  targetAudience: string;
  geographicZone: string;
  // Sección 4 — Contexto adicional
  socialMedia: string;
  internalNotes: string;
  // Opciones heredadas
  objectives: string[];
  customObjective: string;
  competitors: string;
  includeKeywordsInStrategyPdf: boolean;
  generateKeywords: boolean;
};

export default function AuditForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [form, setForm] = useState<FormState>({
    apiKey: '',
    selectedModules: ['market-research', 'seo-audit', 'meta-ads', 'google-ads', 'roadmap'],
    websiteUrl: '',
    clientName: '',
    city: '',
    country: 'Colombia',
    businessType: '',
    sector: '',
    services: '',
    businessDescription: '',
    ticketAverage: '',
    monthlyGoal: '',
    differentiator: '',
    knownCompetitors: '',
    metaAdsBudget: '',
    monthlyBudgetCOP: '',
    campaignGoal: 'whatsapp',
    targetAudience: '',
    geographicZone: '',
    socialMedia: '',
    internalNotes: '',
    objectives: [],
    customObjective: '',
    competitors: '',
    includeKeywordsInStrategyPdf: true,
    generateKeywords: true,
  });

  function set(field: keyof FormState, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleObjective(val: string) {
    setForm(prev => ({
      ...prev,
      objectives: prev.objectives.includes(val)
        ? prev.objectives.filter(o => o !== val)
        : [...prev.objectives, val],
    }));
  }

  function toggleModule(val: string) {
    setForm(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(val)
        ? prev.selectedModules.filter(m => m !== val)
        : [...prev.selectedModules, val],
    }));
  }

  function selectAllModules() {
    setForm(prev => ({ ...prev, selectedModules: MODULES.map(m => m.value) }));
  }

  const totalPdfs = form.selectedModules.length * 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.websiteUrl || !form.clientName || !form.city) {
      setError('URL, nombre del cliente y ciudad son obligatorios.');
      return;
    }
    if (form.selectedModules.length === 0) {
      setError('Selecciona al menos un módulo para generar.');
      return;
    }

    setLoading(true);
    try {
      const body = {
        websiteUrl: form.websiteUrl,
        clientName: form.clientName,
        city: form.city,
        country: form.country,
        businessType: form.businessType || undefined,
        sector: form.sector || undefined,
        services: form.services || undefined,
        businessDescription: form.businessDescription || undefined,
        ticketAverage: form.ticketAverage || undefined,
        monthlyGoal: form.monthlyGoal || undefined,
        differentiator: form.differentiator || undefined,
        knownCompetitors: form.knownCompetitors || undefined,
        metaAdsBudget: form.metaAdsBudget || undefined,
        monthlyBudgetCOP: form.monthlyBudgetCOP
          ? parseInt(form.monthlyBudgetCOP.replace(/\D/g, ''), 10)
          : undefined,
        campaignGoal: form.campaignGoal || undefined,
        targetAudience: form.targetAudience || undefined,
        geographicZone: form.geographicZone || undefined,
        socialMedia: form.socialMedia || undefined,
        internalNotes: form.internalNotes || undefined,
        objectives: form.objectives.length ? form.objectives : ['traffic'],
        customObjective: form.customObjective || undefined,
        competitors: form.competitors
          ? form.competitors.split(',').map(c => c.trim()).filter(Boolean)
          : [],
        includeKeywordsInStrategyPdf: form.includeKeywordsInStrategyPdf,
        generateKeywords: form.generateKeywords,
        apiKey: form.apiKey || undefined,
        selectedModules: form.selectedModules,
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

      {/* ── API KEY ─────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔑</span>
          <h2 className="text-sm font-bold text-amber-800">Anthropic API Key</h2>
          <span className="ml-auto text-xs text-amber-600">Opcional si ya está en .env.local</span>
        </div>
        <div className="flex gap-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            className="field-input flex-1 font-mono text-xs"
            placeholder="sk-ant-api03-..."
            value={form.apiKey}
            onChange={e => set('apiKey', e.target.value)}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(v => !v)}
            className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-700 hover:bg-amber-100"
            title={showApiKey ? 'Ocultar' : 'Mostrar'}
          >
            {showApiKey ? '🙈' : '👁️'}
          </button>
        </div>
        <p className="mt-2 text-xs text-amber-600">
          La key se usa solo para esta generación. Si tienes <code className="bg-amber-100 px-1 rounded">.env.local</code> configurado, deja este campo vacío.
        </p>
      </section>

      {/* ── MÓDULOS A GENERAR ───────────────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-altive-700 text-xs font-bold text-white">★</span>
            <h2 className="text-base font-bold text-altive-700">¿Qué quieres generar?</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={selectAllModules}
              className="text-xs text-altive-600 hover:text-altive-800 underline">
              Seleccionar todo
            </button>
            <span className="text-slate-300">|</span>
            <button type="button" onClick={() => set('selectedModules', [])}
              className="text-xs text-slate-400 hover:text-slate-600 underline">
              Limpiar
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(mod => {
            const active = form.selectedModules.includes(mod.value);
            return (
              <button
                key={mod.value}
                type="button"
                onClick={() => toggleModule(mod.value)}
                className={clsx(
                  'rounded-xl border-2 p-4 text-left transition-all',
                  active
                    ? 'border-altive-500 bg-altive-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={clsx('text-sm font-bold', active ? 'text-altive-700' : 'text-slate-700')}>
                    {mod.label}
                  </span>
                  <span className={clsx(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs transition-all',
                    active
                      ? 'border-altive-500 bg-altive-500 text-white'
                      : 'border-slate-300 bg-white text-transparent',
                  )}>✓</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{mod.desc}</p>
                {active && (
                  <div className="mt-2 text-xs font-medium text-altive-600">
                    2 PDFs: Agencia + Cliente
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {form.selectedModules.length === 0 && (
          <p className="mt-3 text-xs text-red-500">⚠️ Selecciona al menos un módulo.</p>
        )}
      </section>

      {/* ── SECCIÓN 1: DATOS DEL CLIENTE ───────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-altive-700 text-xs font-bold text-white">1</span>
          <h2 className="text-base font-bold text-altive-700">Datos del cliente</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Nombre del cliente *</label>
            <input className="field-input" placeholder="Ej: Vera Oftalmología"
              value={form.clientName} onChange={e => set('clientName', e.target.value)} required />
          </div>
          <div>
            <label className="field-label">URL del sitio web *</label>
            <input className="field-input" type="url" placeholder="https://ejemplo.com"
              value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Tipo de negocio</label>
            <input className="field-input" placeholder="Ej: Clínica de urología, Consultorio dental"
              value={form.businessType} onChange={e => set('businessType', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Sector</label>
            <select className="field-input" value={form.sector} onChange={e => set('sector', e.target.value)}>
              <option value="">Seleccionar sector...</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Ciudad *</label>
            <input className="field-input" placeholder="Ej: Medellín"
              value={form.city} onChange={e => set('city', e.target.value)} required />
          </div>
          <div>
            <label className="field-label">País</label>
            <input className="field-input" placeholder="Colombia"
              value={form.country} onChange={e => set('country', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Servicios principales</label>
            <textarea className="field-input min-h-[80px] resize-y"
              placeholder="Ej: Consultas urológicas, cirugía láser, tratamiento de cálculos renales..."
              value={form.services} onChange={e => set('services', e.target.value)} />
            <p className="mt-1 text-xs text-slate-400">Separados por coma o salto de línea.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Descripción del negocio</label>
            <textarea className="field-input min-h-[80px] resize-y"
              placeholder="Describe el negocio, su historia, qué lo hace especial... (máx. 500 caracteres)"
              maxLength={500}
              value={form.businessDescription} onChange={e => set('businessDescription', e.target.value)} />
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: DATOS COMERCIALES ───────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-altive-700 text-xs font-bold text-white">2</span>
          <h2 className="text-base font-bold text-altive-700">Datos comerciales</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Ticket promedio</label>
            <input className="field-input" placeholder="Ej: $150.000 COP / consulta"
              value={form.ticketAverage} onChange={e => set('ticketAverage', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Objetivo mensual de negocio</label>
            <input className="field-input" placeholder="Ej: 20 consultas nuevas al mes"
              value={form.monthlyGoal} onChange={e => set('monthlyGoal', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Diferencial percibido por el cliente</label>
            <textarea className="field-input min-h-[80px] resize-y"
              placeholder="¿Qué cree el cliente que lo diferencia de la competencia?"
              value={form.differentiator} onChange={e => set('differentiator', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Competidores conocidos (opcional)</label>
            <textarea className="field-input min-h-[70px] resize-y"
              placeholder="Ej: clinicaX.com, Clínica Y, Dr. Pérez — separados por coma o salto de línea"
              value={form.knownCompetitors} onChange={e => set('knownCompetitors', e.target.value)} />
            <p className="mt-1 text-xs text-slate-400">Si no escribes ninguno, la IA los detecta automáticamente.</p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: DATOS DE PAUTA ───────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-altive-700 text-xs font-bold text-white">3</span>
          <h2 className="text-base font-bold text-altive-700">Datos de pauta</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Presupuesto Meta Ads</label>
            <input className="field-input" placeholder="Ej: $1.500.000 COP / mes"
              value={form.metaAdsBudget} onChange={e => set('metaAdsBudget', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Presupuesto Google Ads (COP)</label>
            <input className="field-input" placeholder="Ej: 1000000"
              value={form.monthlyBudgetCOP} onChange={e => set('monthlyBudgetCOP', e.target.value)} />
            <p className="mt-1 text-xs text-slate-400">Solo el número. Deja vacío para que la IA proponga 3 escenarios.</p>
          </div>
          <div>
            <label className="field-label">Objetivo de campaña</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CAMPAIGN_GOALS.map(g => (
                <button key={g.value} type="button"
                  onClick={() => set('campaignGoal', g.value)}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    form.campaignGoal === g.value
                      ? 'border-altive-500 bg-altive-500 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-altive-300',
                  )}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Zona geográfica de pauta</label>
            <input className="field-input" placeholder="Ej: Medellín, Envigado, Sabaneta"
              value={form.geographicZone} onChange={e => set('geographicZone', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Público objetivo</label>
            <textarea className="field-input min-h-[80px] resize-y"
              placeholder="Describe el cliente ideal: edad, género, situación, comportamiento, qué le duele, qué busca..."
              value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)} />
          </div>
        </div>

        {/* Objetivos de ads */}
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="mb-2 text-sm font-medium text-slate-700">Objetivos de la publicidad</p>
          <p className="mb-3 text-xs text-slate-500">Selecciona todos los que apliquen.</p>
          <div className="flex flex-wrap gap-2">
            {OBJECTIVES.map(obj => (
              <button key={obj.value} type="button" onClick={() => toggleObjective(obj.value)}
                className={clsx(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                  form.objectives.includes(obj.value)
                    ? 'border-altive-500 bg-altive-500 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-altive-300',
                )}>
                {obj.label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="field-label">Objetivo personalizado (opcional)</label>
            <input className="field-input" placeholder="Ej: Quiero que vengan más pacientes de estratos 4-6"
              value={form.customObjective} onChange={e => set('customObjective', e.target.value)} />
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: CONTEXTO ADICIONAL ──────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-xs font-bold text-white">4</span>
          <h2 className="text-base font-bold text-altive-700">Contexto adicional <span className="text-xs font-normal text-slate-400">(opcional)</span></h2>
        </div>
        <div className="grid gap-4">
          <div>
            <label className="field-label">Redes sociales</label>
            <input className="field-input"
              placeholder="Ej: instagram.com/clinica, facebook.com/clinica"
              value={form.socialMedia} onChange={e => set('socialMedia', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Notas internas / briefing</label>
            <textarea className="field-input min-h-[90px] resize-y"
              placeholder="Observaciones propias, contexto extra, particularidades del cliente..."
              value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} />
          </div>
        </div>

        {/* Opciones de PDFs */}
        <div className="mt-5 border-t border-slate-100 pt-5 space-y-4">
          <p className="text-sm font-medium text-slate-700">Opciones de los PDFs</p>
          <label className="flex cursor-pointer items-start gap-4">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-altive-500"
              checked={form.generateKeywords}
              onChange={e => set('generateKeywords', e.target.checked)} />
            <div>
              <div className="font-medium text-slate-800">Generar keywords basadas en la estrategia</div>
              <div className="text-sm text-slate-500">Claude investigará y clasificará las palabras clave por campaña.</div>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-4">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-altive-500"
              checked={form.includeKeywordsInStrategyPdf}
              onChange={e => set('includeKeywordsInStrategyPdf', e.target.checked)} />
            <div>
              <div className="font-medium text-slate-800">Incluir keywords completas en el PDF de Google Ads (agencia)</div>
              <div className="text-sm text-slate-500">Si está activo, el PDF incluye todas las keywords de cada grupo de anuncios.</div>
            </div>
          </label>
        </div>
      </section>

      {/* ── ERROR + CTA ─────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-altive-100 bg-altive-50 px-6 py-4">
        <div>
          <div className="text-sm font-semibold text-altive-700">
            {totalPdfs > 0
              ? `Se generarán ${totalPdfs} PDF${totalPdfs !== 1 ? 's' : ''}`
              : 'Selecciona al menos un módulo'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {form.selectedModules.map(m => MODULES.find(x => x.value === m)?.label?.split(' ').slice(1).join(' ')).filter(Boolean).join(' · ')}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            ⏱ Tiempo estimado: {form.selectedModules.length <= 2 ? '1–2' : form.selectedModules.length <= 4 ? '2–3' : '3–5'} minutos
          </div>
        </div>
        <button type="submit" disabled={loading || form.selectedModules.length === 0}
          className={clsx(
            'rounded-lg px-6 py-3 text-sm font-bold text-white transition-all',
            loading || form.selectedModules.length === 0
              ? 'cursor-not-allowed bg-slate-300'
              : 'bg-altive-700 shadow-md hover:bg-altive-600 active:scale-95',
          )}>
          {loading ? 'Iniciando...' : '🚀 Generar estrategia'}
        </button>
      </div>
    </form>
  );
}
