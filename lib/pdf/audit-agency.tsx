import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles, colors, severityStyle } from './theme';
import { H1, H2, H3, P, Bullets, Callout, Table, Footer } from './shared';
import type { AuditContent } from '../types';

export const AuditAgencyPDF: React.FC<{ data: AuditContent }> = ({ data }) => {
  const dateStr = new Date(data.meta.generatedAt).toLocaleDateString('es-CO');
  return (
    <Document title={`Auditoría SEO — ${data.meta.clientName}`}>
      {/* PORTADA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverWrap}>
          <Text style={{ fontSize: 10, color: colors.celeste, marginBottom: 10 }}>
            ALTIVE TOOLS · AUDITORÍA INTEGRAL
          </Text>
          <Text style={styles.coverTitle}>Auditoría SEO Integral</Text>
          <Text style={styles.coverSub}>{data.meta.clientName}</Text>
          <Text style={styles.coverSub}>{data.meta.url}</Text>
          <Text style={styles.coverSub}>
            {data.meta.city} · {data.meta.country}
          </Text>
          <Text style={styles.coverSmall}>
            Documento técnico · Uso interno / Agencia · {dateStr}
          </Text>
        </View>
        <Footer label={`Auditoría SEO · ${data.meta.clientName} · Interno`} />
      </Page>

      {/* RESUMEN EJECUTIVO */}
      <Page size="A4" style={styles.page}>
        <H1>1. Resumen Ejecutivo</H1>
        <P>{data.executiveSummary}</P>

        <H3>Top prioridades</H3>
        <Table
          columns={[
            { header: '#', width: 6, render: (r) => r.rank },
            { header: 'Prioridad', width: 54, render: (r) => r.title },
            { header: 'Impacto', width: 14, render: (r) => r.impact },
            { header: 'Esfuerzo', width: 14, render: (r) => r.effort },
            { header: 'Ventana', width: 12, render: (r) => r.window },
          ]}
          rows={data.topPriorities}
        />

        <H1>2. Auditoría On-Page</H1>
        <Table
          columns={[
            { header: 'Elemento', width: 22, render: (r) => r.element },
            { header: 'Actual', width: 26, render: (r) => r.current },
            { header: 'Problema', width: 28, render: (r) => r.problem },
            {
              header: 'Sev.',
              width: 10,
              render: (r) => (
                <Text style={[styles.badge, severityStyle(r.severity)]}>
                  {r.severity}
                </Text>
              ),
            },
            { header: 'Fix', width: 14, render: (r) => r.fix },
          ]}
          rows={data.onPageIssues}
        />
        <Footer label={`Auditoría SEO · ${data.meta.clientName} · Interno`} />
      </Page>

      {/* TÉCNICO + COMPETIDORES */}
      <Page size="A4" style={styles.page}>
        <H1>3. Auditoría Técnica</H1>
        <Table
          columns={[
            { header: 'Check', width: 30, render: (r) => r.check },
            { header: 'Estado', width: 14, render: (r) => r.status },
            { header: 'Detalle / Acción', width: 56, render: (r) => r.detail },
          ]}
          rows={data.technicalAudit}
        />

        <H1>4. Mapa Competitivo</H1>
        <Table
          columns={[
            { header: 'Competidor', width: 22, render: (r) => r.name },
            { header: 'Fortaleza', width: 30, render: (r) => r.strength },
            { header: 'Debilidad', width: 32, render: (r) => r.weakness },
            { header: 'Amenaza', width: 16, render: (r) => r.threat },
          ]}
          rows={data.competitors}
        />
        <Footer label={`Auditoría SEO · ${data.meta.clientName} · Interno`} />
      </Page>

      {/* KEYWORDS */}
      <Page size="A4" style={styles.page}>
        <H1>5. Keyword Research</H1>

        <H2>5.1 Transaccionales / Comerciales</H2>
        <Table
          columns={[
            { header: 'Keyword', width: 52, render: (r) => r.keyword },
            { header: 'Intención', width: 18, render: (r) => r.intent },
            { header: 'Dificultad', width: 15, render: (r) => r.difficulty },
            { header: 'Volumen', width: 15, render: (r) => r.volume },
          ]}
          rows={data.keywordOpportunities.transactional}
        />

        <H2>5.2 Síntomas / Long-tail</H2>
        <Table
          columns={[
            { header: 'Keyword', width: 52, render: (r) => r.keyword },
            { header: 'Intención', width: 18, render: (r) => r.intent },
            { header: 'Dificultad', width: 15, render: (r) => r.difficulty },
            { header: 'Volumen', width: 15, render: (r) => r.volume },
          ]}
          rows={data.keywordOpportunities.symptoms}
        />

        <H2>5.3 Marca</H2>
        <Table
          columns={[
            { header: 'Keyword', width: 70, render: (r) => r.keyword },
            { header: 'Dificultad', width: 15, render: (r) => r.difficulty },
            { header: 'Volumen', width: 15, render: (r) => r.volume },
          ]}
          rows={data.keywordOpportunities.brand}
        />
        <Footer label={`Auditoría SEO · ${data.meta.clientName} · Interno`} />
      </Page>

      {/* CONTENT GAPS + LOCAL */}
      <Page size="A4" style={styles.page}>
        <H1>6. Content Gaps</H1>
        <Table
          columns={[
            { header: 'URL propuesta', width: 40, render: (r) => r.url },
            { header: 'Tipo', width: 14, render: (r) => r.type },
            { header: 'Keyword objetivo', width: 34, render: (r) => r.keyword },
            { header: 'Prio.', width: 12, render: (r) => r.priority },
          ]}
          rows={data.contentGaps}
        />

        <H1>7. SEO Local (GBP + NAP)</H1>
        <Table
          columns={[
            { header: 'Ítem', width: 36, render: (r) => r.item },
            { header: 'Acción', width: 64, render: (r) => r.action },
          ]}
          rows={data.localSeoChecklist}
        />

        <H1>8. E-E-A-T Checklist</H1>
        <Bullets items={data.eeatChecklist} />
        <Footer label={`Auditoría SEO · ${data.meta.clientName} · Interno`} />
      </Page>

      {/* PLAN + KPIs + ROADMAP */}
      <Page size="A4" style={styles.page}>
        <H1>9. Plan de Acción</H1>

        <H2>Quick Wins</H2>
        <Table
          columns={[
            { header: 'Acción', width: 68, render: (r) => r.action },
            { header: 'Impacto', width: 16, render: (r) => r.impact },
            { header: 'Esfuerzo', width: 16, render: (r) => r.effort },
          ]}
          rows={data.actionPlan.quickWins}
        />

        <H2>Inversiones Estratégicas</H2>
        <Table
          columns={[
            { header: 'Acción', width: 68, render: (r) => r.action },
            { header: 'Impacto', width: 16, render: (r) => r.impact },
            { header: 'Esfuerzo', width: 16, render: (r) => r.effort },
          ]}
          rows={data.actionPlan.strategic}
        />

        <H1>10. KPIs y Roadmap</H1>
        <Table
          columns={[
            { header: 'KPI', width: 40, render: (r) => r.kpi },
            { header: 'Baseline', width: 20, render: (r) => r.baseline },
            { header: 'Meta 3m', width: 20, render: (r) => r.m3 },
            { header: 'Meta 6m', width: 20, render: (r) => r.m6 },
          ]}
          rows={data.kpis}
        />

        <H2>Roadmap</H2>
        <Table
          columns={[
            { header: 'Mes', width: 12, render: (r) => r.month },
            { header: 'Foco', width: 30, render: (r) => r.focus },
            { header: 'Entregable', width: 58, render: (r) => r.deliverable },
          ]}
          rows={data.roadmap}
        />

        <Callout color={colors.verde}>
          Cierre: con ejecución disciplinada del plan de 6 meses, el sitio puede posicionar en primera página para keywords de alto valor. La ventana para moverse es ahora.
        </Callout>
        <Footer label={`Auditoría SEO · ${data.meta.clientName} · Interno`} />
      </Page>
    </Document>
  );
};
