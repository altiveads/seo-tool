import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { scrapeSite } from './scraper';
import { expandKeywords, defaultSeeds } from './keywords';
import { generateAuditJson, generateAdsJson } from './claude';
import { generateMarketResearchJson } from './market-research';
import { generateMetaAdsJson } from './meta-ads';
import { generateRoadmapJson } from './roadmap';
import { updateJob } from './jobs';
import type { AuditInput } from './types';

const execFileAsync = promisify(execFile);
const OUTPUT_DIR  = path.join(process.cwd(), 'generated');
const SCRIPTS_DIR = path.join(process.cwd(), 'scripts');

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

/** Ejecuta un script Python y lanza error si falla. */
async function runPython(script: string, jsonFile: string, outPdf: string): Promise<void> {
  const scriptPath = path.join(SCRIPTS_DIR, script);
  try {
    const { stdout, stderr } = await execFileAsync(
      'python3',
      [scriptPath, jsonFile, outPdf],
      { timeout: 120_000 },
    );
    if (stdout) console.log(`[python/${script}]`, stdout.trim());
    if (stderr) console.warn(`[python/${script}] stderr:`, stderr.trim());
  } catch (err: any) {
    throw new Error(
      `Error en ${script}: ${err?.stderr ?? err?.message ?? String(err)}`,
    );
  }
}

export async function runPipeline(jobId: string, input: AuditInput) {
  try {
    await ensureDir(OUTPUT_DIR);
    const jobDir = path.join(OUTPUT_DIR, jobId);
    await ensureDir(jobDir);

    // ── PASO 1: Market Research ────────────────────────────────────────────
    updateJob(jobId, { status: 'market_research', progress: 5, step: 'Investigando el mercado… (1/2 llamadas IA)' });
    const marketResearchJson = await generateMarketResearchJson(input);
    updateJob(jobId, { progress: 14, step: 'Investigación de mercado completada.' });

    // ── PASO 2: Scraping ───────────────────────────────────────────────────
    updateJob(jobId, { status: 'scraping', progress: 18, step: 'Analizando el sitio web…' });
    const site = await scrapeSite(input.websiteUrl);

    // ── PASO 3: Keywords ───────────────────────────────────────────────────
    updateJob(jobId, { status: 'keywords', progress: 24, step: 'Expandiendo palabras clave…' });
    const services = site.h2s.slice(0, 6);
    const seeds = defaultSeeds({ clientName: input.clientName, city: input.city, services });
    const kwResults = await expandKeywords(seeds, { deep: false });

    // ── PASO 4: SEO Audit (3 llamadas internas) ────────────────────────────
    updateJob(jobId, { status: 'analyzing', progress: 28, step: 'Generando auditoría SEO… (1/3 llamadas IA)' });
    const auditJson = await generateAuditJson(input, site, kwResults);
    updateJob(jobId, { progress: 44, step: 'Auditoría SEO completada.' });

    // ── PASO 5: Meta Ads Strategy (2 llamadas internas) ───────────────────
    updateJob(jobId, { status: 'meta_ads', progress: 48, step: 'Construyendo estrategia Meta Ads… (1/2 llamadas IA)' });
    const metaAdsJson = await generateMetaAdsJson(input, marketResearchJson, auditJson);
    updateJob(jobId, { progress: 57, step: 'Estrategia Meta Ads completada.' });

    // ── PASO 6: Google Ads (2 llamadas internas) ──────────────────────────
    updateJob(jobId, { status: 'analyzing', progress: 60, step: 'Construyendo estrategia Google Ads… (1/2 llamadas IA)' });
    const adsJson = await generateAdsJson(input, auditJson);
    updateJob(jobId, { progress: 68, step: 'Estrategia Google Ads completada.' });

    // ── PASO 7: Roadmap integrado (2 llamadas internas) ───────────────────
    updateJob(jobId, { status: 'roadmap', progress: 70, step: 'Generando roadmap integrado… (1/2 llamadas IA)' });
    const roadmapJson = await generateRoadmapJson(
      input,
      marketResearchJson,
      auditJson,
      metaAdsJson,
      adsJson,
    );
    updateJob(jobId, { progress: 78, step: 'Roadmap integrado completado. Generando PDFs…' });

    // ── PASO 8: Guardar JSONs ──────────────────────────────────────────────
    const mrJsonPath     = path.join(jobDir, 'market-research.json');
    const auditJsonPath  = path.join(jobDir, 'audit.json');
    const metaJsonPath   = path.join(jobDir, 'meta-ads.json');
    const adsJsonPath    = path.join(jobDir, 'ads.json');
    const roadmapJsonPath = path.join(jobDir, 'roadmap.json');

    await Promise.all([
      fs.writeFile(mrJsonPath,      JSON.stringify(marketResearchJson, null, 2), 'utf-8'),
      fs.writeFile(auditJsonPath,   JSON.stringify(auditJson,          null, 2), 'utf-8'),
      fs.writeFile(metaJsonPath,    JSON.stringify(metaAdsJson,        null, 2), 'utf-8'),
      fs.writeFile(adsJsonPath,     JSON.stringify(adsJson,            null, 2), 'utf-8'),
      fs.writeFile(roadmapJsonPath, JSON.stringify(roadmapJson,        null, 2), 'utf-8'),
    ]);

    // ── PASO 9: Generar 10 PDFs ────────────────────────────────────────────
    updateJob(jobId, { status: 'generating_pdfs', progress: 80, step: 'Generando PDF: Market Research Agencia…' });
    const pdfMrAg = path.join(jobDir, 'market-research-agencia.pdf');
    await runPython('pdf_market_research_agencia.py', mrJsonPath, pdfMrAg);

    updateJob(jobId, { progress: 82, step: 'Generando PDF: Market Research Cliente…' });
    const pdfMrCl = path.join(jobDir, 'market-research-cliente.pdf');
    await runPython('pdf_market_research_cliente.py', mrJsonPath, pdfMrCl);

    updateJob(jobId, { progress: 84, step: 'Generando PDF: Auditoría SEO Agencia…' });
    const pdfAuditAg = path.join(jobDir, 'auditoria-seo-agencia.pdf');
    await runPython('pdf_auditoria_agencia.py', auditJsonPath, pdfAuditAg);

    updateJob(jobId, { progress: 86, step: 'Generando PDF: Auditoría SEO Cliente…' });
    const pdfAuditCl = path.join(jobDir, 'auditoria-seo-cliente.pdf');
    await runPython('pdf_auditoria_cliente.py', auditJsonPath, pdfAuditCl);

    updateJob(jobId, { progress: 88, step: 'Generando PDF: Meta Ads Agencia…' });
    const pdfMetaAg = path.join(jobDir, 'meta-ads-agencia.pdf');
    await runPython('pdf_meta_ads_agencia.py', metaJsonPath, pdfMetaAg);

    updateJob(jobId, { progress: 90, step: 'Generando PDF: Meta Ads Cliente…' });
    const pdfMetaCl = path.join(jobDir, 'meta-ads-cliente.pdf');
    await runPython('pdf_meta_ads_cliente.py', metaJsonPath, pdfMetaCl);

    updateJob(jobId, { progress: 92, step: 'Generando PDF: Google Ads Agencia…' });
    const pdfAdsAg = path.join(jobDir, 'google-ads-agencia.pdf');
    await runPython('pdf_ads_agencia.py', adsJsonPath, pdfAdsAg);

    updateJob(jobId, { progress: 94, step: 'Generando PDF: Google Ads Cliente…' });
    const pdfAdsCl = path.join(jobDir, 'google-ads-cliente.pdf');
    await runPython('pdf_ads_cliente.py', adsJsonPath, pdfAdsCl);

    updateJob(jobId, { progress: 96, step: 'Generando PDF: Roadmap Agencia…' });
    const pdfRoadmapAg = path.join(jobDir, 'roadmap-agencia.pdf');
    await runPython('pdf_roadmap_agencia.py', roadmapJsonPath, pdfRoadmapAg);

    updateJob(jobId, { progress: 98, step: 'Generando PDF: Roadmap Cliente…' });
    const pdfRoadmapCl = path.join(jobDir, 'roadmap-cliente.pdf');
    await runPython('pdf_roadmap_cliente.py', roadmapJsonPath, pdfRoadmapCl);

    // ── PASO 10: ¡Listo! ───────────────────────────────────────────────────
    updateJob(jobId, {
      status: 'done',
      progress: 100,
      step: '¡Listo! Los 10 PDFs están listos para descargar.',
      files: {
        'market-research-agencia': pdfMrAg,
        'market-research-cliente': pdfMrCl,
        'auditoria-seo-agencia':   pdfAuditAg,
        'auditoria-seo-cliente':   pdfAuditCl,
        'meta-ads-agencia':        pdfMetaAg,
        'meta-ads-cliente':        pdfMetaCl,
        'google-ads-agencia':      pdfAdsAg,
        'google-ads-cliente':      pdfAdsCl,
        'roadmap-agencia':         pdfRoadmapAg,
        'roadmap-cliente':         pdfRoadmapCl,
      },
    });
  } catch (err: any) {
    console.error(`[pipeline] Job ${jobId} falló:`, err);
    updateJob(jobId, {
      status: 'error',
      progress: 0,
      step: 'Error en la generación.',
      error: err?.message ?? String(err),
    });
  }
}
