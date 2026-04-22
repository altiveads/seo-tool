# ALTIVE TOOLS

Generador automatizado de **Auditorías SEO** y **Estrategias de Google Ads** en PDF.  
Construido con Next.js 15 + Claude (Anthropic SDK) + @react-pdf/renderer.

---

## Entregables que genera

| PDF | Destinatario | Contenido |
|-----|-------------|-----------|
| Auditoría SEO — Agencia | Interno | Técnico completo: on-page, técnico, keywords, content gaps, competidores, KPIs, roadmap |
| Auditoría SEO — Cliente | Cliente | Versión amigable: qué está bien, qué falta, oportunidades, plan 6 meses |
| Estrategia Google Ads — Agencia | Interno | 3 campañas con grupos, keywords, ad copy RSA, escenarios de presupuesto, medición, negativos |
| Google Ads — Cliente | Cliente | Explicación sencilla del plan, dónde aparece, resultados esperados, compromisos |

---

## Requisitos

- Node.js 18+
- Clave de API de Anthropic (Claude)

---

## Instalación

```bash
cd seo-tool
npm install
```

Crea el archivo `.env.local` con tu clave:

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Uso en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), llena el formulario y descarga los PDFs.

---

## Build de producción (servidor propio / Railway / Fly.io)

```bash
npm run build
npm start
```

> **Vercel:** funciona en Vercel Pro (timeout de 60s). Para generaciones largas (>60s) usa Railway, Fly.io o tu propio servidor.

---

## Variables de entorno

| Variable | Descripción | Default |
|---------|-------------|---------|
| `ANTHROPIC_API_KEY` | Clave de API de Claude | — (requerida) |
| `ANTHROPIC_MODEL` | Modelo de Claude | `claude-sonnet-4-5` |

---

## Estructura del proyecto

```
seo-tool/
├── app/
│   ├── layout.tsx          # Layout raíz con header ALTIVE TOOLS
│   ├── page.tsx            # Página de inicio con formulario
│   ├── globals.css         # Tailwind + clases reutilizables
│   ├── job/[id]/page.tsx   # Página de progreso y descarga
│   └── api/
│       ├── generate/       # POST — inicia la generación
│       └── jobs/[id]/      # GET — estado · GET download/[key] — descarga PDF
├── components/
│   ├── AuditForm.tsx       # Formulario principal
│   └── JobStatus.tsx       # Barra de progreso + botones de descarga
├── lib/
│   ├── types.ts            # Tipos TypeScript compartidos
│   ├── jobs.ts             # Store en memoria de jobs
│   ├── scraper.ts          # Scraping del sitio (HTML, robots, sitemap)
│   ├── keywords.ts         # Expansión gratuita via Google autocomplete
│   ├── claude.ts           # Llamadas a Claude API (SEO + Ads)
│   ├── pipeline.ts         # Orquestador: scrape → keywords → claude → pdfs
│   └── pdf/
│       ├── theme.ts        # Colores y estilos compartidos
│       ├── shared.tsx      # Componentes reutilizables (Table, Bullets, etc.)
│       ├── audit-agency.tsx
│       ├── audit-client.tsx
│       ├── ads-agency.tsx
│       ├── ads-client.tsx
│       └── index.ts        # Genera y devuelve los 4 buffers
└── generated/              # PDFs generados (ignorado por git)
```

---

## Flujo de generación

```
Formulario → POST /api/generate → createJob() → runPipeline() [background]
                                                      ↓
                                               scrapeSite()
                                                      ↓
                                             expandKeywords()
                                                      ↓
                                         generateAuditContent() [Claude]
                                                      ↓
                                          generateAdsContent() [Claude]
                                                      ↓
                                             generateAllPdfs()
                                                      ↓
                                            Guardar en /generated/{jobId}/
                                                      ↓
                                           job.status = 'done' ✓

JobStatus.tsx polls GET /api/jobs/{id} cada 2.5s → muestra progreso
Al terminar → 4 botones de descarga → GET /api/jobs/{id}/download/{key}
```

---

## Sin APIs de pago

Las keywords se generan con:
1. **Google Autocomplete** (gratis, no requiere API key)
2. **Claude** para clasificar y ampliar semánticamente

Para datos de volumen real, conecta DataForSEO o Google Keyword Planner en `lib/keywords.ts`.

---

Hecho con 💙 por Altive
# seo-tool
