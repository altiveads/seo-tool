import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles, colors } from './theme';
import { H1, H2, P, Bullets, Callout, Table, Footer, StatCard } from './shared';
import type { AdsContent } from '../types';

export const AdsClientPDF: React.FC<{ data: AdsContent }> = ({ data }) => {
  const dateStr = new Date(data.meta.generatedAt).toLocaleDateString('es-CO');
  const cf = data.clientFriendly;
  const budgetLabel = data.meta.monthlyBudgetCOP
    ? `$${data.meta.monthlyBudgetCOP.toLocaleString('es-CO')} COP/mes`
    : 'A definir contigo';

  return (
    <Document title={`Google Ads — ${data.meta.clientName}`}>
      {/* PORTADA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverWrap}>
          <Text style={{ fontSize: 10, color: colors.celeste, marginBottom: 10 }}>
            ALTIVE · PLAN DE PUBLICIDAD DIGITAL
          </Text>
          <Text style={styles.coverTitle}>Cómo Vamos a Aparecer en Google</Text>
          <Text style={styles.coverSub}>{data.meta.clientName}</Text>
          <Text style={styles.coverSub}>
            {data.meta.city} · {budgetLabel}
          </Text>
          <Text style={styles.coverSmall}>Preparado por Altive · {dateStr}</Text>
        </View>
        <Footer label={`Plan Google Ads · ${data.meta.clientName}`} />
      </Page>

      {/* LA IDEA */}
      <Page size="A4" style={styles.page}>
        <H1>La idea en pocas palabras</H1>
        <Callout color={colors.celeste}>
          {cf.theIdea}
        </Callout>

        <H1>¿Dónde vas a aparecer?</H1>
        <P big>
          Cuando alguien en {data.meta.city} busca algo relacionado con tu negocio, tus anuncios van
          a aparecer en estos lugares:
        </P>
        <Table
          columns={[
            { header: '¿Dónde?', width: 35, render: (r) => r.location },
            { header: '¿Qué ve la persona?', width: 65, render: (r) => r.userSees },
          ]}
          rows={cf.whereYouAppear}
        />
        <Footer label={`Plan Google Ads · ${data.meta.clientName}`} />
      </Page>

      {/* LAS 3 CAMPAÑAS EXPLICADAS */}
      <Page size="A4" style={styles.page}>
        <H1>Las 3 campañas que vamos a activar</H1>
        <P big>
          Tu estrategia se divide en 3 campañas, cada una con un objetivo claro y un tipo de persona
          diferente a la que le habla:
        </P>
        {cf.campaignsExplained.map((camp, i) => (
          <View
            key={i}
            style={[
              styles.callout,
              {
                borderLeftColor: [colors.celeste, colors.verde, colors.altive][i] || colors.celeste,
                marginBottom: 10,
              },
            ]}
          >
            <Text
              style={{ fontFamily: 'Helvetica-Bold', fontSize: 12, color: colors.altive, marginBottom: 5 }}
            >
              {i + 1}. {camp.name}
            </Text>
            <Text style={{ fontSize: 11, color: colors.gris, lineHeight: 1.55 }}>
              {camp.explanation}
            </Text>
          </View>
        ))}
        <Footer label={`Plan Google Ads · ${data.meta.clientName}`} />
      </Page>

      {/* RESULTADOS ESPERADOS */}
      <Page size="A4" style={styles.page}>
        <H1>¿Qué resultados podemos esperar?</H1>
        <P big>
          Estos son los estimados según el presupuesto invertido. Son proyecciones basadas en el
          mercado de {data.meta.city} — los resultados reales pueden variar:
        </P>
        <Table
          columns={[
            { header: 'Escenario', width: 18, render: (r) => r.scenario },
            { header: 'Inversión/mes', width: 22, render: (r) => r.investment },
            { header: 'Visitas/mes', width: 20, render: (r) => r.monthlyVisits },
            { header: 'Visitas/día', width: 20, render: (r) => r.dailyVisits },
            { header: 'Costo/visita', width: 20, render: (r) => r.costPerVisit },
          ]}
          rows={cf.expectedResults}
        />

        <Callout color={colors.naranja}>
          Nota importante: el objetivo de esta campaña es maximizar el tráfico hacia tu sitio web,
          no las ventas directas. Cada visita es una persona que conoce tu negocio y puede volver.
        </Callout>

        <H1>Lo que necesitamos de tu parte</H1>
        <Bullets items={cf.whatWeNeedFromYou} />
        <Footer label={`Plan Google Ads · ${data.meta.clientName}`} />
      </Page>

      {/* NUESTRO COMPROMISO */}
      <Page size="A4" style={styles.page}>
        <H1>Nuestro compromiso contigo</H1>
        <P big>
          Esto es lo que nos comprometemos a hacer para que tu inversión en Google Ads valga la pena:
        </P>
        {cf.ourPromise.map((p, i) => (
          <View key={i} style={[styles.bulletRow, { marginBottom: 6 }]}>
            <Text style={[styles.bullet, { color: colors.verde, fontSize: 14 }]}>✓</Text>
            <Text style={[styles.bulletText, { fontSize: 11, lineHeight: 1.55 }]}>{p}</Text>
          </View>
        ))}
        <View style={{ marginTop: 24 }}>
          <Callout color={colors.verde}>
            Google Ads bien configurado puede empezar a traer tráfico desde el primer día. A
            diferencia del SEO orgánico, los resultados son inmediatos. La clave está en la
            configuración inicial y la optimización semanal que hacemos nosotros.
          </Callout>
        </View>
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 13, color: colors.altive }}>
            ¿Empezamos?
          </Text>
          <Text style={{ fontSize: 10, color: colors.grisClaro, marginTop: 4 }}>
            Altive · www.altive.co
          </Text>
        </View>
        <Footer label={`Plan Google Ads · ${data.meta.clientName}`} />
      </Page>
    </Document>
  );
};
