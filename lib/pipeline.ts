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

const PDF_STEP_LABELS: Record<string, string> = {
  'market-research-agencia': 'Market Research Agencia',
  'market-research-cliente': 'Market Research Cliente',
  'auditoria-seo-agencia':   'Auditoría SEO Agencia',
  'auditoria-seo-cliente':   'Auditoría SEO Cliente',
  'meta-ads-agencia':        'Meta Ads Agencia',
  'meta-ads-cliente':        'Meta Ads Cliente',
  'google-ads-agencia':      'Google Ads Agencia',
  'google-ads-cliente':      'Google Ads Cliente',
  'roadmap-agencia':         'Roadmap Agencia',
  'roadmap-cliente':         'Roadmap Cliente',
};

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
    // Usar API key del formulario si fue ingresada manualmente
    if (input.apiKey) {
      process.env.ANTHROPIC_API_KEY = input.apiKey;
    }

    const ALL_MODULES = ['market-research', 'seo-audit', 'meta-ads', 'google-ads', 'roadmap'];
    const modules = (input.selectedModules && input.selectedModules.length > 0)
      ? input.selectedModules
      : ALL_MODULES;

    const doMR     = modules.includes('market-research');
    const doSEO    = modules.includes('seo-audit');
    const doMeta   = modules.includes('meta-ads');
    const doGoogle = modules.includes('google-ads');
    const doRoadmap = modules.includes('roadmap');

    await ensureDir(OUTPUT_DIR);
    const jobDir = path.join(OUTPUT_DIR, jobId);
    await ensureDir(jobDir);

    // Calcular progreso dinámico según módulos seleccionados
    const aiStepCount = [doMR, doSEO, doMeta, doGoogle, doRoadmap].filter(Boolean).length;
    let aiStepsDone = 0;
    const aiProgress = () => Math.round(5 + (aiStepsDone / Math.max(aiStepCount, 1)) * 70);

    // ── PASO 1: Market Research ────────────────────────────────────────────
    let marketResearchJson: any = null;
    if (doMR) {
      updateJob(jobId, { status: 'market_research', progress: aiProgress(), step: 'Investigando el mercado… (1/2 llamadas IA)' });
      marketResearchJson = await generateMarketResearchJson(input);
      aiStepsDone++;
      updateJob(jobId, { progress: aiProgress(), step: 'Investigación de mercado completada.' });
    }

    // ── PASO 2: Scraping + Keywords (si algún módulo lo necesita) ──────────
    let site: any = null;
    let kwResults: any = null;
    if (doSEO || doMeta || doGoogle) {
      updateJob(jobId, { status: 'scraping', progress: aiProgress(), step: 'Analizando el sitio web…' });
      site = await scrapeSite(input.websiteUrl);
      updateJob(jobId, { status: 'keywords', step: 'Expandiendo palabras clave…' });
      const services = site.h2s.slice(0, 6);
      const seeds = defaultSeeds({ clientName: input.clientName, city: input.city, services });
      kwResults = await expandKeywords(seeds, { deep: false });
    }

    // ── PASO 3: SEO Audit ──────────────────────────────────────────────────
    let auditJson: any = null;
    if (doSEO && site && kwResults) {
      updateJob(jobId, { status: 'analyzing', progress: aiProgress(), step: 'Generando auditoría SEO… (1/3 llamadas IA)' });
      auditJson = await generateAuditJson(input, site, kwResults);
      aiStepsDone++;
      updateJob(jobId, { progress: aiProgress(), step: 'Auditoría SEO completada.' });
    }

    // ── PASO 4: Meta Ads ───────────────────────────────────────────────────
    let metaAdsJson: any = null;
    if (doMeta) {
      updateJob(jobId, { status: 'meta_ads', progress: aiProgress(), step: 'Construyendo estrategia Meta Ads… (1/2 llamadas IA)' });
      metaAdsJson = await generateMetaAdsJson(input, marketResearchJson, auditJson);
      aiStepsDone++;
      updateJob(jobId, { progress: aiProgress(), step: 'Estrategia Meta Ads completada.' });
    }

    // ── PASO 5: Google Ads ─────────────────────────────────────────────────
    let adsJson: any = null;
    if (doGoogle) {
      updateJob(jobId, { status: 'analyzing', progress: aiProgress(), step: 'Construyendo estrategia Google Ads… (1/2 llamadas IA)' });
      adsJson = await generateAdsJson(input, auditJson);
      aiStepsDone++;
      updateJob(jobId, { progress: aiProgress(), step: 'Estrategia Google Ads completada.' });
    }

    // ── PASO 6: Roadmap integrado ──────────────────────────────────────────
    let roadmapJson: any = null;
    if (doRoadmap) {
      updateJob(jobId, { status: 'roadmap', progress: aiProgress(), step: 'Generando roadmap integrado… (1/2 llamadas IA)' });
      roadmapJson = await generateRoadmapJson(input, marketResearchJson, auditJson, metaAdsJson, adsJson);
      aiStepsDone++;
      updateJob(jobId, { progress: aiProgress(), step: 'Roadmap completado. Generando PDFs…' });
    }

    // ── PASO 7: Guardar JSONs ──────────────────────────────────────────────
    updateJob(jobId, { status: 'generating_pdfs', progress: 78, step: 'Guardando datos y generando PDFs…' });
    const writeOps: Promise<void>[] = [];
    if (marketResearchJson) writeOps.push(fs.writeFile(path.join(jobDir, 'market-research.json'), JSON.stringify(marketResearchJson, null, 2), 'utf-8'));
    if (auditJson)          writeOps.push(fs.writeFile(path.join(jobDir, 'audit.json'),           JSON.stringify(auditJson, null, 2),          'utf-8'));
    if (metaAdsJson)        writeOps.push(fs.writeFile(path.join(jobDir, 'meta-ads.json'),        JSON.stringify(metaAdsJson, null, 2),        'utf-8'));
    if (adsJson)            writeOps.push(fs.writeFile(path.join(jobDir, 'ads.json'),             JSON.stringify(adsJson, null, 2),            'utf-8'));
    if (roadmapJson)        writeOps.push(fs.writeFile(path.join(jobDir, 'roadmap.json'),         JSON.stringify(roadmapJson, null, 2),        'utf-8'));
    await Promise.all(writeOps);

    // ── PASO 8: Generar PDFs de los módulos seleccionados ─────────────────
    type PdfStep = [string, string, string];
    const pdfSteps: PdfStep[] = [
      ...(doMR     ? [
        ['market-research-agencia', 'pdf_market_research_agencia.py', 'market-research.json'],
        ['market-research-cliente', 'pdf_market_research_cliente.py', 'market-research.json'],
      ] as PdfStep[] : []),
      ...(doSEO    ? [
        ['auditoria-seo-agencia',   'pdf_auditoria_agencia.py',       'audit.json'],
        ['auditoria-seo-cliente',   'pdf_auditoria_cliente.py',       'audit.json'],
      ] as PdfStep[] : []),
      ...(doMeta   ? [
        ['meta-ads-agencia',        'pdf_meta_ads_agencia.py',        'meta-ads.json'],
        ['meta-ads-cliente',        'pdf_meta_ads_cliente.py',        'meta-ads.json'],
      ] as PdfStep[] : []),
      ...(doGoogle ? [
        ['google-ads-agencia',      'pdf_ads_agencia.py',             'ads.json'],
        ['google-ads-cliente',      'pdf_ads_cliente.py',             'ads.json'],
      ] as PdfStep[] : []),
      ...(doRoadmap ? [
        ['roadmap-agencia',         'pdf_roadmap_agencia.py',         'roadmap.json'],
        ['roadmap-cliente',         'pdf_roadmap_cliente.py',         'roadmap.json'],
      ] as PdfStep[] : []),
    ];

    const generatedFiles: Record<string, string> = {};
    const totalPdfs = pdfSteps.length;

    for (let i = 0; i < pdfSteps.length; i++) {
      const [key, script, jsonFile] = pdfSteps[i];
      const progress = 78 + Math.round(((i + 1) / totalPdfs) * 20);
      const label = PDF_STEP_LABELS[key] ?? key;
      updateJob(jobId, { progress, step: `Generando PDF: ${label}…` });
      const pdfPath = path.join(jobDir, `${key}.pdf`);
      await runPython(script, path.join(jobDir, jsonFile), pdfPath);
      generatedFiles[key] = pdfPath;
    }

    // ── ¡Listo! ────────────────────────────────────────────────────────────
    const n = Object.keys(generatedFiles).length;
    updateJob(jobId, {
      status: 'done',
      progress: 100,
      step: `¡Listo! ${n} PDF${n !== 1 ? 's' : ''} listos para descargar.`,
      files: generatedFiles,
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
