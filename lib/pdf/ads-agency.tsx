import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles, colors } from './theme';
import { H1, H2, H3, P, Bullets, Callout, Table, Footer } from './shared';
import type { AdsContent } from '../types';
import type { AuditInput } from '../types';

export const AdsAgencyPDF: React.FC<{ data: AdsContent; input: AuditInput }> = ({
  data,
  input,
}) => {
  const dateStr = new Date(data.meta.generatedAt).toLocaleDateString('es-CO');
  const budgetLabel = data.meta.monthlyBudgetCOP
    ? `$${data.meta.monthlyBudgetCOP.toLocaleString('es-CO')} COP/mes`
    : 'Por definir';

  return (
    <Document title={`Estrategia Google Ads — ${data.meta.clientName}`}>
      {/* PORTADA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverWrap}>
          <Text style={{ fontSize: 10, color: colors.celeste, marginBottom: 10 }}>
            ALTIVE TOOLS · GOOGLE ADS STRATEGY
          </Text>
          <Text style={styles.coverTitle}>Estrategia Google Ads</Text>
          <Text style={styles.coverSub}>{data.meta.clientName}</Text>
          <Text style={styles.coverSub}>
            {data.meta.city} · Presupuesto: {budgetLabel}
          </Text>
          <Text style={styles.coverSmall}>
            Documento técnico · Uso interno / Agencia · {dateStr}
          </Text>
        </View>
        <Footer label={`Google Ads Strategy · ${data.meta.clientName} · Interno`} />
      </Page>

      {/* THESIS + POLÍTICAS */}
      <Page size="A4" style={styles.page}>
        <H1>1. Tesis Estratégica</H1>
        <Callout>{data.thesis}</Callout>

        <H1>2. Políticas de Google Ads Aplicables</H1>
        <P>Las siguientes políticas rigen los anuncios para este cliente. Todos los copies han sido diseñados en cumplimiento de estas normas:</P>
        <Table
          columns={[
            { header: 'Política', width: 36, render: (r) => r.policy },
            { header: 'Aplicación en este cliente', width: 64, render: (r) => r.application },
          ]}
          rows={data.policies}
        />
        <Footer label={`Google Ads Strategy · ${data.meta.clientName} · Interno`} />
      </Page>

      {/* CAMPAÑAS */}
      {data.campaigns.map((campaign, ci) => (
        <Page key={ci} size="A4" style={styles.page}>
          <H1>{campaign.name}</H1>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {[
              { l: 'Intención', v: campaign.intent },
              { l: 'Volumen objetivo', v: campaign.volumeTarget },
              { l: 'CPC estimado', v: campaign.cpcRange },
            ].map((m, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  padding: 8,
                  backgroundColor: colors.fondoSuave,
                  borderRadius: 3,
                }}
              >
                <Text style={{ fontSize: 8, color: colors.grisClaro }}>{m.l}</Text>
                <Text
                  style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.altive, marginTop: 2 }}
                >
                  {m.v}
                </Text>
              </View>
            ))}
          </View>

          <H2>Grupos de anuncios y Keywords</H2>
          {input.generateKeywords
            ? campaign.adGroups.map((ag, agi) => (
                <View key={agi} style={{ marginBottom: 8 }}>
                  <Text
                    style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: colors.celeste, marginBottom: 3 }}
                  >
                    {ag.name} → Landing: {ag.landing}
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.gris, lineHeight: 1.45 }}>
                    {ag.keywords.join(' · ')}
                  </Text>
                </View>
              ))
            : campaign.adGroups.map((ag, agi) => (
                <View key={agi} style={{ marginBottom: 4 }}>
                  <Text
                    style={{ fontSize: 9, color: colors.gris }}
                  >
                    {ag.name} — {ag.keywords.slice(0, 4).join(', ')}
                    {ag.keywords.length > 4 ? ` (+${ag.keywords.length - 4} más)` : ''}
                    {' → '}{ag.landing}
                  </Text>
                </View>
              ))}

          <H2>Ad Copy RSA</H2>
          <H3>Titulares (máx. 30 car.)</H3>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {campaign.adCopy.headlines.map((h, hi) => (
              <View
                key={hi}
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 3,
                  backgroundColor: colors.fondoTabla,
                  borderWidth: 0.5,
                  borderColor: colors.borde,
                  borderRadius: 2,
                }}
              >
                <Text style={{ fontSize: 8, color: colors.gris }}>{h}</Text>
              </View>
            ))}
          </View>

          <H3>Descripciones (máx. 90 car.)</H3>
          <Bullets items={campaign.adCopy.descriptions} />

          <H3>Extensiones recomendadas</H3>
          <Bullets items={campaign.extensions} />

          <Footer label={`Google Ads Strategy · ${data.meta.clientName} · Interno`} />
        </Page>
      ))}

      {/* PRESUPUESTO + TARGETING */}
      <Page size="A4" style={styles.page}>
        <H1>6. Escenarios de Presupuesto</H1>
        <Table
          columns={[
            { header: 'Escenario', width: 14, render: (r) => r.name },
            { header: 'Total/mes', width: 16, render: (r) => r.total },
            { header: 'C1 Síntomas', width: 16, render: (r) => r.c1 },
            { header: 'C2 Servicios', width: 16, render: (r) => r.c2 },
            { header: 'C3 Marca', width: 16, render: (r) => r.c3 },
            { header: 'Clicks est.', width: 22, render: (r) => r.clicksEstimate },
          ]}
          rows={data.budgetScenarios}
        />

        <H1>7. Targeting</H1>
        <H2>Ubicaciones</H2>
        <Bullets items={data.targeting.locations} />
        <H2>Dispositivos</H2>
        <P>{data.targeting.devices}</P>
        <H2>Horario</H2>
        <P>{data.targeting.schedule}</P>
        <H2>Audiencias (RLSA)</H2>
        <Bullets items={data.targeting.audiences} />
        <Footer label={`Google Ads Strategy · ${data.meta.clientName} · Interno`} />
      </Page>

      {/* MEDICIÓN + NEGATIVOS */}
      <Page size="A4" style={styles.page}>
        <H1>8. Medición y Conversiones</H1>
        <P>Stack recomendado: {data.measurement.stack.join(' · ')}</P>
        <Table
          columns={[
            { header: 'Evento', width: 28, render: (r) => r.event },
            { header: 'Categoría', width: 18, render: (r) => r.category },
            { header: 'Trigger / Cómo medir', width: 54, render: (r) => r.trigger },
          ]}
          rows={data.measurement.events}
        />

        <H1>9. Keywords Negativas</H1>
        <H2>Lista global</H2>
        <Text style={{ fontSize: 9, color: colors.gris, lineHeight: 1.5 }}>
          {data.negatives.global.join(' · ')}
        </Text>
        <H2>Por campaña</H2>
        {data.negatives.byCampaign.map((bc, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: colors.celeste }}>
              {bc.campaign}
            </Text>
            <Text style={{ fontSize: 9, color: colors.gris, lineHeight: 1.45 }}>
              {bc.items.join(' · ')}
            </Text>
          </View>
        ))}

        <Callout color={colors.verde}>
          Implementar medición correctamente desde el día 1 es lo más importante. Sin datos no hay
          optimización. Configura GA4 + GTM antes de activar los anuncios.
        </Callout>
        <Footer label={`Google Ads Strategy · ${data.meta.clientName} · Interno`} />
      </Page>
    </Document>
  );
};
