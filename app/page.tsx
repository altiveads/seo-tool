import AuditForm from '@/components/AuditForm';

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-altive-200 bg-altive-50 px-4 py-1.5 text-xs font-semibold text-altive-600 mb-4">
          🛠 Uso interno · Altive
        </div>
        <h1 className="text-3xl font-bold text-altive-700 mb-3">
          Generador de Auditorías SEO
          <br />y Estrategias Google Ads
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
          Llena el formulario, espera ~90 segundos y descarga los 4 PDFs listos
          para presentar: auditoría técnica, informe para el cliente, estrategia
          de Ads para agencia y presentación de Ads para el cliente.
        </p>
      </div>

      {/* Badges de entregables */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { icon: '🔍', label: 'Auditoría SEO', sub: 'Agencia' },
          { icon: '📄', label: 'Resumen Digital', sub: 'Cliente' },
          { icon: '⚙️', label: 'Estrategia Ads', sub: 'Agencia' },
          { icon: '🎯', label: 'Plan Publicidad', sub: 'Cliente' },
        ].map((b) => (
          <div
            key={b.label}
            className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm"
          >
            <div className="text-xl mb-1">{b.icon}</div>
            <div className="text-xs font-semibold text-slate-700">{b.label}</div>
            <div className="text-xs text-slate-400">{b.sub}</div>
          </div>
        ))}
      </div>

      <AuditForm />
    </div>
  );
}
