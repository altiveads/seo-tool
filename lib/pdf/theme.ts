import { StyleSheet } from '@react-pdf/renderer';

export const colors = {
  altive: '#0B3B5F',
  celeste: '#2E86AB',
  gris: '#3D3D3D',
  grisClaro: '#6B7280',
  verde: '#1E8449',
  naranja: '#E67E22',
  rojo: '#C0392B',
  morado: '#6C3483',
  fondoSuave: '#EEF5FB',
  fondoTabla: '#F4F7FA',
  borde: '#CFD8E3',
  blanco: '#FFFFFF',
};

export const styles = StyleSheet.create({
  // Documento base
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.gris,
    lineHeight: 1.4,
  },
  // Portada
  coverWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    color: colors.altive,
    textAlign: 'center',
    marginBottom: 14,
  },
  coverSub: {
    fontSize: 14,
    color: colors.celeste,
    textAlign: 'center',
    marginBottom: 8,
  },
  coverSmall: {
    fontSize: 10,
    color: colors.gris,
    textAlign: 'center',
    marginTop: 20,
  },
  // Headings
  h1: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.altive,
    marginBottom: 10,
    marginTop: 4,
  },
  h2: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.celeste,
    marginBottom: 6,
    marginTop: 10,
  },
  h3: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.altive,
    marginBottom: 4,
    marginTop: 8,
  },
  // Texto
  body: {
    fontSize: 10,
    color: colors.gris,
    marginBottom: 6,
    lineHeight: 1.5,
  },
  bodyBig: {
    fontSize: 11,
    color: colors.gris,
    marginBottom: 8,
    lineHeight: 1.55,
  },
  small: {
    fontSize: 9,
    color: colors.grisClaro,
  },
  // Listas
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    width: 10,
    fontSize: 10,
    color: colors.celeste,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: colors.gris,
    lineHeight: 1.45,
  },
  // Callout
  callout: {
    padding: 10,
    backgroundColor: colors.fondoSuave,
    borderLeftWidth: 3,
    borderLeftColor: colors.celeste,
    marginVertical: 8,
  },
  calloutText: {
    fontSize: 10,
    color: colors.altive,
    lineHeight: 1.5,
  },
  // Tabla
  tableWrap: {
    borderWidth: 0.5,
    borderColor: colors.borde,
    marginVertical: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.altive,
  },
  tableHeaderCell: {
    padding: 6,
    color: colors.blanco,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.borde,
  },
  tableRowAlt: {
    backgroundColor: colors.fondoTabla,
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    color: colors.gris,
    lineHeight: 1.4,
  },
  // Severity / badge
  badge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  badgeCritico: { backgroundColor: '#FDECEC', color: colors.rojo },
  badgeAlto: { backgroundColor: '#FDEBD0', color: colors.naranja },
  badgeMedio: { backgroundColor: '#FEF9E7', color: '#B9770E' },
  badgeBajo: { backgroundColor: '#E8F8F5', color: colors.verde },
  badgeOk: { backgroundColor: '#D5F5E3', color: colors.verde },
  // Pie de página
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 8,
    color: colors.grisClaro,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: colors.borde,
    paddingTop: 6,
  },
});

export function severityStyle(sev?: string) {
  const s = (sev || '').toUpperCase();
  if (s === 'CRÍTICO' || s === 'CRITICO') return styles.badgeCritico;
  if (s === 'ALTO') return styles.badgeAlto;
  if (s === 'MEDIO') return styles.badgeMedio;
  if (s === 'BAJO') return styles.badgeBajo;
  if (s === 'OK') return styles.badgeOk;
  return styles.badgeMedio;
}
