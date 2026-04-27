// ─── Tipos compartidos de ALTIVE TOOLS ───────────────────────────────────────

export type Objective =
  | 'traffic'
  | 'leads'
  | 'brand'
  | 'conversions'
  | 'retargeting';

export type CampaignGoal =
  | 'whatsapp'
  | 'calls'
  | 'form'
  | 'visits';

export interface AuditInput {
  // ── Sección 1: Datos del cliente ──────────────────────────────────────────
  websiteUrl: string;
  clientName: string;
  city: string;
  country: string;
  businessType?: string;        // tipo_negocio
  sector?: string;              // sector
  services?: string;            // servicios_principales (texto libre)
  businessDescription?: string; // descripcion_negocio

  // ── Sección 2: Datos comerciales ──────────────────────────────────────────
  ticketAverage?: string;       // ticket_promedio
  monthlyGoal?: string;         // objetivo_mensual
  differentiator?: string;      // diferencial_percibido
  knownCompetitors?: string;    // competidores_conocidos (texto libre)

  // ── Sección 3: Datos de pauta ─────────────────────────────────────────────
  metaAdsBudget?: string;       // presupuesto_meta_ads
  monthlyBudgetCOP?: number;    // presupuesto_google_ads (mantiene compatibilidad)
  campaignGoal?: CampaignGoal;  // objetivo_campana
  targetAudience?: string;      // publico_objetivo
  geographicZone?: string;      // zona_geografica_pauta

  // ── Sección 4: Contexto adicional ─────────────────────────────────────────
  socialMedia?: string;         // redes_sociales
  internalNotes?: string;       // notas_internas

  // ── Campos heredados ──────────────────────────────────────────────────────
  objectives: Objective[];
  customObjective?: string;
  competitors?: string[];
  includeKeywordsInStrategyPdf: boolean;
  generateKeywords: boolean;

  // ── Configuración ─────────────────────────────────────────────────────────
  apiKey?: string;               // API key ingresada manualmente en la UI
  selectedModules?: string[];    // módulos a generar: market-research, seo-audit, meta-ads, google-ads, roadmap
}

export interface ScrapedSite {
  url: string;
  title?: string;
  metaDescription?: string;
  h1?: string;
  h2s: string[];
  h3s: string[];
  bodyText: string;
  images: { src: string; alt: string }[];
  internalLinks: string[];
  externalLinks: string[];
  social: Record<string, string>;
  robotsTxt?: string;
  sitemapStatus: 'ok' | 'missing' | 'error';
  cms?: string;
  hasSchema: boolean;
  hasOpenGraph: boolean;
  lang?: string;
  canonical?: string;
}

export interface KeywordItem {
  keyword: string;
  intent: 'informational' | 'commercial' | 'transactional' | 'brand';
  difficulty: 'low' | 'medium' | 'high';
  volume: 'low' | 'medium' | 'high' | 'very_high';
  campaign?: 'symptoms' | 'services' | 'brand';
}

export interface AuditContent {
  meta: {
    url: string;
    clientName: string;
    city: string;
    country: string;
    generatedAt: string;
  };
  executiveSummary: string;
  topPriorities: {
    rank: number;
    title: string;
    impact: string;
    effort: string;
    window: string;
  }[];
  onPageIssues: {
    element: string;
    current: string;
    problem: string;
    severity: 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO' | 'OK';
    fix: string;
  }[];
  technicalAudit: {
    check: string;
    status: 'OK' | 'WARN' | 'FAIL';
    detail: string;
  }[];
  competitors: {
    name: string;
    strength: string;
    weakness: string;
    threat: 'Alta' | 'Media' | 'Baja';
  }[];
  contentGaps: {
    url: string;
    type: string;
    keyword: string;
    priority: 'P1' | 'P2' | 'P3';
  }[];
  keywordOpportunities: {
    transactional: KeywordItem[];
    symptoms: KeywordItem[];
    brand: KeywordItem[];
  };
  localSeoChecklist: { item: string; action: string }[];
  eeatChecklist: string[];
  actionPlan: {
    quickWins: { action: string; impact: string; effort: string }[];
    strategic: { action: string; impact: string; effort: string }[];
  };
  kpis: { kpi: string; baseline: string; m3: string; m6: string }[];
  roadmap: { month: string; focus: string; deliverable: string }[];
  clientFriendly: {
    whatsGood: string[];
    whatsMissing: string[];
    opportunities: { title: string; why: string }[];
    plan6Months: { month: string; work: string; gain: string }[];
    expectedResults: {
      indicator: string;
      now: string;
      m3: string;
      m6: string;
    }[];
  };
}

export interface AdsContent {
  meta: {
    clientName: string;
    city: string;
    monthlyBudgetCOP?: number;
    generatedAt: string;
  };
  thesis: string;
  policies: { policy: string; application: string }[];
  campaigns: {
    id: 'symptoms' | 'services' | 'brand';
    name: string;
    intent: string;
    volumeTarget: string;
    cpcRange: string;
    adGroups: {
      name: string;
      keywords: string[];
      landing: string;
    }[];
    adCopy: {
      headlines: string[];
      descriptions: string[];
    };
    extensions: string[];
  }[];
  budgetScenarios: {
    name: string;
    total: string;
    c1: string;
    c2: string;
    c3: string;
    clicksEstimate: string;
  }[];
  targeting: {
    locations: string[];
    devices: string;
    schedule: string;
    audiences: string[];
  };
  measurement: {
    events: { event: string; category: string; trigger: string }[];
    stack: string[];
  };
  negatives: {
    global: string[];
    byCampaign: { campaign: string; items: string[] }[];
  };
  clientFriendly: {
    theIdea: string;
    campaignsExplained: {
      name: string;
      explanation: string;
    }[];
    whereYouAppear: { location: string; userSees: string }[];
    expectedResults: {
      scenario: string;
      investment: string;
      monthlyVisits: string;
      dailyVisits: string;
      costPerVisit: string;
    }[];
    whatWeNeedFromYou: string[];
    ourPromise: string[];
  };
}

export interface JobState {
  id: string;
  createdAt: number;
  status:
    | 'queued'
    | 'market_research'
    | 'scraping'
    | 'keywords'
    | 'analyzing'
    | 'meta_ads'
    | 'roadmap'
    | 'generating_pdfs'
    | 'done'
    | 'error';
  progress: number;
  step: string;
  error?: string;
  input: AuditInput;
  audit?: AuditContent;
  ads?: AdsContent;
  files?: Record<string, string>; // filename -> path on disk
}
