import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles, colors } from './theme';

/** Título grande H1. */
export const H1: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.h1}>{children}</Text>
);
export const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.h2}>{children}</Text>
);
export const H3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.h3}>{children}</Text>
);
export const P: React.FC<{ children: React.ReactNode; big?: boolean }> = ({
  children,
  big,
}) => <Text style={big ? styles.bodyBig : styles.body}>{children}</Text>;

/** Lista con bullet circular. */
export const Bullets: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <View style={{ marginBottom: 6 }}>
    {items.map((t, i) => (
      <View key={i} style={styles.bulletRow}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>{t}</Text>
      </View>
    ))}
  </View>
);

/** Callout con franja lateral. */
export const Callout: React.FC<{
  children: React.ReactNode;
  color?: string;
}> = ({ children, color }) => (
  <View
    style={[
      styles.callout,
      color ? { borderLeftColor: color } : {},
    ]}
  >
    <Text style={styles.calloutText}>{children}</Text>
  </View>
);

/** Tabla simple con encabezado y filas alternas. */
export interface Col {
  header: string;
  width: number; // en porcentaje (sumar 100)
  render?: (row: any) => React.ReactNode;
  key?: string;
}

export const Table: React.FC<{
  columns: Col[];
  rows: any[];
}> = ({ columns, rows }) => (
  <View style={styles.tableWrap}>
    <View style={styles.tableHeader}>
      {columns.map((c, i) => (
        <Text
          key={i}
          style={[styles.tableHeaderCell, { width: `${c.width}%` }]}
        >
          {c.header}
        </Text>
      ))}
    </View>
    {rows.map((row, rIdx) => (
      <View
        key={rIdx}
        style={[styles.tableRow, rIdx % 2 ? styles.tableRowAlt : {}]}
      >
        {columns.map((c, cIdx) => {
          const content = c.render ? c.render(row) : c.key ? row[c.key] : '';
          return (
            <View
              key={cIdx}
              style={[styles.tableCell, { width: `${c.width}%` }]}
            >
              {typeof content === 'string' || typeof content === 'number' ? (
                <Text>{String(content)}</Text>
              ) : (
                content
              )}
            </View>
          );
        })}
      </View>
    ))}
  </View>
);

/** Pie de página compartido. */
export const Footer: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.footer} fixed>
    <Text>{label}</Text>
    <Text
      render={({ pageNumber, totalPages }) =>
        `Pág. ${pageNumber} / ${totalPages}`
      }
    />
  </View>
);

/** Caja de dato destacado (para resultados / números grandes). */
export const StatCard: React.FC<{ big: string; label: string; color?: string }> =
  ({ big, label, color }) => (
    <View
      style={{
        padding: 12,
        backgroundColor: colors.fondoSuave,
        borderLeftWidth: 3,
        borderLeftColor: color || colors.celeste,
        marginVertical: 4,
      }}
    >
      <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: colors.altive }}>
        {big}
      </Text>
      <Text style={{ fontSize: 10, color: colors.grisClaro, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
