import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles, colors } from './theme';
import { H1, H2, P, Bullets, Callout, Table, Footer, StatCard } from './shared';
import type { AuditContent } from '../types';

export const AuditClientPDF: React.FC<{ data: AuditContent }> = ({ data }) => {
  const dateStr = new Date(data.meta.generatedAt).toLocaleDateString('es-CO');
  const cf = data.clientFriendly;

  return (
    <Document title={`Tu presencia digital — ${data.meta.clientName}`}>
      {/* PORTADA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverWrap}>
          <Text style={{ fontSize: 10, color: colors.celeste, marginBottom: 10 }}>
            ALTIVE · ANÁLISIS DIGITAL
          </Text>
          <Text style={styles.coverTitle}>Tu Presencia Digital en Google</Text>
          <Text style={styles.coverSub}>{data.meta.clientName}</Text>
          <Text style={styles.coverSub}>
            {data.meta.city} · {data.meta.country}
          </Text>
          <Text style={styles.coverSmall}>Preparado por Altive · {dateStr}</Text>
        </View>
        <Footer label={`Tu presencia digital · ${data.meta.clientName}`} />
      </Page>

      {/* LO QUE ESTÁ BIEN */}
      <Page size="A4" style={styles.page}>
        <H1>Lo que ya está funcionando bien ✓</H1>
        <P big>
          Tu sitio tiene una base sólida. Aquí están los puntos que ya están trabajando a tu favor:
        </P>
        <Bullets items={cf.whatsGood} />

        <H1>Lo que le falta a tu sitio</H1>
        <P big>
          Estos son los aspectos donde hay oportunidad de mejorar. Ninguno es crítico por sí solo,
          pero juntos están frenando tu visibilidad en Google:
        </P>
        <Bullets items={cf.whatsMissing} />
        <Footer label={`Tu presencia digital · ${data.meta.clientName}`} />
      </Page>

      {/* OPORTUNIDADES */}
      <Page size="A4" style={styles.page}>
        <H1>Oportunidades que no puedes dejar pasar</H1>
        <P big>
          Estas son las acciones con mayor potencial para crecer en Google en los próximos meses:
        </P>
        {cf.opportunities.map((op, i) => (
          <View key={i} style={styles.callout}>
            <Text
              style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: colors.altive, marginBottom: 4 }}
            >
              {op.title}
            </Text>
            <Text style={{ fontSize: 10, color: colors.gris, lineHeight: 1.5 }}>{op.why}</Text>
          </View>
        ))}
        <Footer label={`Tu presencia digital · ${data.meta.clientName}`} />
      </Page>

      {/* PLAN 6 MESES */}
      <Page size="A4" style={styles.page}>
        <H1>¿Qué vamos a hacer en 6 meses?</H1>
        <P big>
          Este es el plan de trabajo mes a mes. Cada acción está pensada para construir sobre la
          anterior y generar resultados progresivos:
        </P>
        <Table
          columns={[
            { header: 'Período', width: 16, render: (r) => r.month },
            { header: '¿Qué hacemos?', width: 44, render: (r) => r.work },
            { header: '¿Qué ganas?', width: 40, render: (r) => r.gain },
          ]}
          rows={cf.plan6Months}
        />

        <H1>Resultados esperados</H1>
        <P>Proyecciones basadas en el comportamiento promedio del mercado en {data.meta.city}:</P>
        <Table
          columns={[
            { header: 'Indicador', width: 40, render: (r) => r.indicator },
            { header: 'Hoy', width: 20, render: (r) => r.now },
            { header: '3 meses', width: 20, render: (r) => r.m3 },
            { header: '6 meses', width: 20, render: (r) => r.m6 },
          ]}
          rows={cf.expectedResults}
        />

        <Callout color={colors.verde}>
          El SEO orgánico es una inversión a mediano plazo. Los primeros resultados visibles llegan
          entre el mes 2 y 3. A los 6 meses, el sitio debería estar posicionando de forma consistente
          para los términos más importantes de tu negocio.
        </Callout>
        <Footer label={`Tu presencia digital · ${data.meta.clientName}`} />
      </Page>
    </Document>
  );
};
