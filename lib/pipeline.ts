import path from 'path';
import fs from 'fs/promises';
import { scrapeSite } from './scraper';
import { expandKeywords, defaultSeeds } from './keywords';
import { generateAuditContent, generateAdsContent } from './claude';
import { generateAllPdfs } from './pdf/index';
import { updateJob } from './jobs';
import type { AuditInput } from './types';

const OUTPUT_DIR = path.join(process.cwd(), 'generated');

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

export async function runPipeline(jobId: string, input: AuditInput) {
  try {
    await ensureOutputDir();

    // 1. Scraping
    updateJob(jobId, { status: 'scraping', progress: 5, step: 'Analizando el sitio web...' });
    const site = await scrapeSite(input.websiteUrl);

    // 2. Keywords (gratis via autocomplete)
    updateJob(jobId, { status: 'keywords', progress: 20, step: 'Expandiendo keywords...' });
    const services = site.h2s.slice(0, 6);
    const seeds = defaultSeeds({ clientName: input.clientName, city: input.city, services });
    const kwResults = await expandKeywords(seeds, { deep: false });

    // 3. Análisis con Claude (Auditoría SEO)
    updateJob(jobId, { status: 'analyzing', progress: 35, step: 'Generando auditoría SEO con IA...' });
    const audit = await generateAuditContent(input, site, kwResults);

    // 4. Estrategia Google Ads con Claude
    updateJob(jobId, { status: 'analyzing', progress: 60, step: 'Generando estrategia Google Ads con IA...' });
    const ads = await generateAdsContent(input, audit);

    // 5. Generar los 4 PDFs
    updateJob(jobId, { status: 'generating_pdfs', progress: 80, step: 'Renderizando PDFs...' });
    const pdfBuffers = await generateAllPdfs({ input, audit, ads });

    // 6. Guardar en disco
    const jobDir = path.join(OUTPUT_DIR, jobId);
    await fs.mkdir(jobDir, { recursive: true });

    const files: Record<string, string> = {};
    for (const [key, buffer] of Object.entries(pdfBuffers)) {
      const filename = `${key}.pdf`;
      const filePath = path.join(jobDir, filename);
      await fs.writeFile(filePath, buffer);
      files[key] = filePath;
    }

    updateJob(jobId, {
      status: 'done',
      progress: 100,
      step: '¡Listo! Los 4 PDFs están listos para descargar.',
      audit,
      ads,
      files,
    });
  } catch (err: any) {
    console.error(`[pipeline] Job ${jobId} failed:`, err);
    updateJob(jobId, {
      status: 'error',
      progress: 0,
      step: 'Error en la generación.',
      error: err?.message ?? String(err),
    });
  }
}
