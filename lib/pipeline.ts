import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { scrapeSite } from './scraper';
import { expandKeywords, defaultSeeds } from './keywords';
import { generateAuditJson, generateAdsJson } from './claude';
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

    // 1. Scraping
    updateJob(jobId, { status: 'scraping', progress: 8, step: 'Analizando el sitio web…' });
    const site = await scrapeSite(input.websiteUrl);

    // 2. Keywords gratis via Google autocomplete
    updateJob(jobId, { status: 'keywords', progress: 20, step: 'Expandiendo palabras clave…' });
    const services = site.h2s.slice(0, 6);
    const seeds = defaultSeeds({ clientName: input.clientName, city: input.city, services });
    const kwResults = await expandKeywords(seeds, { deep: false });

    // 3. Claude: auditoría SEO — 3 llamadas separadas para evitar truncado
    updateJob(jobId, { status: 'analyzing', progress: 30, step: 'Analizando keywords y técnica SEO con IA… (1/3)' });
    // generateAuditJson hace 3 llamadas internamente; el log de consola muestra el progreso
    const auditJson = await generateAuditJson(input, site, kwResults);
    updateJob(jobId, { status: 'analyzing', progress: 54, step: 'Auditoría SEO completada. Generando estrategia Ads… (1/2)' });

    // 4. Claude: estrategia Google Ads — 2 llamadas separadas
    const adsJson = await generateAdsJson(input, auditJson);
    updateJob(jobId, { status: 'analyzing', progress: 68, step: 'Estrategia Ads completada. Generando PDFs…' });

    // 5. Guardar JSONs en disco para los scripts Python
    const auditJsonPath = path.join(jobDir, 'audit.json');
    const adsJsonPath   = path.join(jobDir, 'ads.json');
    await fs.writeFile(auditJsonPath, JSON.stringify(auditJson, null, 2), 'utf-8');
    await fs.writeFile(adsJsonPath,   JSON.stringify(adsJson,   null, 2), 'utf-8');

    // 6. Generar 4 PDFs con Python + reportlab (mismo estilo visual que Vera)
    updateJob(jobId, { status: 'generating_pdfs', progress: 72, step: 'Generando PDF: Auditoría Agencia…' });
    const pdfAuditAg = path.join(jobDir, 'auditoria-seo-agencia.pdf');
    await runPython('pdf_auditoria_agencia.py', auditJsonPath, pdfAuditAg);

    updateJob(jobId, { status: 'generating_pdfs', progress: 80, step: 'Generando PDF: Auditoría Cliente…' });
    const pdfAuditCl = path.join(jobDir, 'auditoria-seo-cliente.pdf');
    await runPython('pdf_auditoria_cliente.py', auditJsonPath, pdfAuditCl);

    updateJob(jobId, { status: 'generating_pdfs', progress: 88, step: 'Generando PDF: Google Ads Agencia…' });
    const pdfAdsAg = path.join(jobDir, 'google-ads-agencia.pdf');
    await runPython('pdf_ads_agencia.py', adsJsonPath, pdfAdsAg);

    updateJob(jobId, { status: 'generating_pdfs', progress: 95, step: 'Generando PDF: Google Ads Cliente…' });
    const pdfAdsCl = path.join(jobDir, 'google-ads-cliente.pdf');
    await runPython('pdf_ads_cliente.py', adsJsonPath, pdfAdsCl);

    // 7. ¡Listo!
    updateJob(jobId, {
      status: 'done',
      progress: 100,
      step: '¡Listo! Los 4 PDFs están listos para descargar.',
      files: {
        'auditoria-seo-agencia': pdfAuditAg,
        'auditoria-seo-cliente': pdfAuditCl,
        'google-ads-agencia':    pdfAdsAg,
        'google-ads-cliente':    pdfAdsCl,
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
