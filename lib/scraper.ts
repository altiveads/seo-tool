import * as cheerio from 'cheerio';
import type { ScrapedSite } from './types';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 AltiveToolsBot/0.1';

async function fetchText(url: string): Promise<{ ok: boolean; text: string; status: number }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
    });
    const text = await res.text();
    return { ok: res.ok, text, status: res.status };
  } catch (e) {
    return { ok: false, text: '', status: 0 };
  }
}

export async function scrapeSite(rawUrl: string): Promise<ScrapedSite> {
  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const origin = new URL(url).origin;

  const [homeRes, robotsRes, sitemapRes] = await Promise.all([
    fetchText(url),
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/sitemap_index.xml`).then(async (r) =>
      r.ok ? r : fetchText(`${origin}/sitemap.xml`),
    ),
  ]);

  const html = homeRes.text;
  const $ = cheerio.load(html || '');

  const h2s = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 25);
  const h3s = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 40);
  const images = $('img')
    .map((_, el) => ({
      src: $(el).attr('src') || '',
      alt: $(el).attr('alt') || '',
    }))
    .get()
    .slice(0, 40);

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      const u = new URL(href, origin);
      if (u.origin === origin) internalLinks.push(u.pathname);
      else externalLinks.push(u.href);
    } catch {}
  });

  const social: Record<string, string> = {};
  externalLinks.forEach((l) => {
    const low = l.toLowerCase();
    if (low.includes('facebook.com') && !social.facebook) social.facebook = l;
    if (low.includes('instagram.com') && !social.instagram) social.instagram = l;
    if (low.includes('youtube.com') && !social.youtube) social.youtube = l;
    if (low.includes('wa.me') || low.includes('whatsapp')) social.whatsapp = social.whatsapp || l;
    if (low.includes('linkedin.com') && !social.linkedin) social.linkedin = l;
    if (low.includes('tiktok.com') && !social.tiktok) social.tiktok = l;
  });

  const hasSchema = /application\/ld\+json/i.test(html);
  const hasOpenGraph = /<meta[^>]+property=["']og:/i.test(html);

  let cms: string | undefined;
  if (/\/wp-content\//i.test(html) || /wp-includes/i.test(html)) cms = 'WordPress';
  else if (/_next\/static/i.test(html)) cms = 'Next.js';
  else if (/shopify/i.test(html)) cms = 'Shopify';
  else if (/wix\.com/i.test(html)) cms = 'Wix';
  else if (/webflow/i.test(html)) cms = 'Webflow';

  const bodyText = $('body')
    .clone()
    .find('script,style,noscript')
    .remove()
    .end()
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);

  return {
    url,
    title: $('title').first().text().trim() || undefined,
    metaDescription: $('meta[name="description"]').attr('content') || undefined,
    h1: $('h1').first().text().trim() || undefined,
    h2s,
    h3s,
    bodyText,
    images,
    internalLinks: Array.from(new Set(internalLinks)).slice(0, 30),
    externalLinks: Array.from(new Set(externalLinks)).slice(0, 30),
    social,
    robotsTxt: robotsRes.ok ? robotsRes.text.slice(0, 1200) : undefined,
    sitemapStatus: sitemapRes.ok ? 'ok' : sitemapRes.status ? 'error' : 'missing',
    cms,
    hasSchema,
    hasOpenGraph,
    lang: $('html').attr('lang') || undefined,
    canonical: $('link[rel="canonical"]').attr('href') || undefined,
  };
}
