"""
ALTIVE TOOLS — PDF Estrategia Google Ads AGENCIA
"""
import sys, json
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    ListFlowable, ListItem
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

AZUL  = colors.HexColor("#0B3B5F"); CEL = colors.HexColor("#2E86AB")
GRIS  = colors.HexColor("#4A4A4A"); VERDE = colors.HexColor("#1E8449")
NAR   = colors.HexColor("#E67E22"); FONDO = colors.HexColor("#F4F7FA")
BORDE = colors.HexColor("#D0D7DE")

_ss = getSampleStyleSheet()
H1  = ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=22, textColor=AZUL, spaceAfter=14, spaceBefore=8, leading=26)
H2  = ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=15, textColor=CEL,  spaceAfter=8,  spaceBefore=14,leading=19)
H3  = ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=12, textColor=AZUL, spaceAfter=6,  spaceBefore=8, leading=15)
BODY= ParagraphStyle('BODY',fontName='Helvetica', fontSize=10, textColor=GRIS, alignment=TA_JUSTIFY, leading=14, spaceAfter=6)
COV_T=ParagraphStyle('COVT',fontName='Helvetica-Bold',fontSize=32,textColor=AZUL,alignment=TA_CENTER,leading=38,spaceAfter=12)
COV_S=ParagraphStyle('COVS',fontName='Helvetica',fontSize=14,textColor=CEL,alignment=TA_CENTER,leading=20,spaceAfter=8)
SMALL=ParagraphStyle('SML', fontName='Helvetica',fontSize=9,textColor=GRIS,alignment=TA_CENTER,leading=12)
CAL_S=ParagraphStyle('CAL', fontName='Helvetica',fontSize=10,textColor=AZUL,backColor=FONDO,borderPadding=8,leading=14)
CELL =ParagraphStyle('CELL',fontName='Helvetica',     fontSize=8.5,textColor=GRIS,alignment=TA_LEFT,leading=11)
CELL_H=ParagraphStyle('CELLH',fontName='Helvetica-Bold',fontSize=9,textColor=colors.white,alignment=TA_CENTER,leading=11)
CHIP =ParagraphStyle('CHIP',fontName='Helvetica',fontSize=8,textColor=AZUL,leading=10)

def footer(canvas, doc):
    m = doc.altive_meta
    canvas.saveState(); canvas.setFont('Helvetica', 8); canvas.setFillColor(GRIS)
    canvas.drawString(2*cm, 1.2*cm, f"Google Ads Strategy · {m['clientName']} · Interno / Agencia")
    canvas.drawRightString(A4[0]-2*cm, 1.2*cm, f"Pág. {doc.page}")
    canvas.setStrokeColor(BORDE); canvas.line(2*cm,1.5*cm,A4[0]-2*cm,1.5*cm); canvas.restoreState()

def _wrap(data):
    out = []
    for ri, row in enumerate(data):
        nrow = [Paragraph(str(c), CELL_H if ri==0 else CELL) if not hasattr(c,'wrap') else c for c in row]
        out.append(nrow)
    return out

def tabla(data, col_widths, header_bg=AZUL):
    t = Table(_wrap(data), colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),header_bg),('TEXTCOLOR',(0,0),(-1,0),colors.white),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTNAME',(0,1),(-1,-1),'Helvetica'),
        ('TEXTCOLOR',(0,1),(-1,-1),GRIS),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('ALIGN',(0,0),(-1,0),'CENTER'),('ALIGN',(0,1),(-1,-1),'LEFT'),
        ('GRID',(0,0),(-1,-1),0.4,BORDE),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,FONDO]),
        ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
    ]))
    return t

def callout(text, color=CEL):
    t = Table([[Paragraph(text, CAL_S)]], colWidths=[16.5*cm])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),FONDO),('LINEBEFORE',(0,0),(0,-1),3,color),
        ('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),
        ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    return t

def bullets(items):
    return ListFlowable([ListItem(Paragraph(i,BODY),leftIndent=10,value='circle') for i in items],
                        bulletType='bullet',start='circle',leftIndent=12)

def kw_chips(keywords):
    """Renderiza keywords como chips en tabla de ancho completo."""
    chips = [Paragraph(f"• {kw}", CHIP) for kw in keywords]
    rows = [chips[i:i+3] for i in range(0, len(chips), 3)]
    if not rows: return Spacer(1,2)
    # pad última fila
    while len(rows[-1]) < 3: rows[-1].append(Paragraph("", CHIP))
    t = Table(rows, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),FONDO),('GRID',(0,0),(-1,-1),0.3,BORDE),
        ('LEFTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),4),
        ('BOTTOMPADDING',(0,0),(-1,-1),4),
    ]))
    return t

def build(d, output_path):
    m = d['meta']; a = d['agency']
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=2*cm)
    doc.altive_meta = m; s = []
    budget = f"${m['monthlyBudgetCOP']:,} COP/mes".replace(',','.') if m.get('monthlyBudgetCOP') else "Por definir"

    # PORTADA
    s += [Spacer(1,4*cm), Paragraph("ESTRATEGIA GOOGLE ADS",COV_T), Paragraph(m['clientName'],COV_S),
          Paragraph(f"{m['city']} · Presupuesto: {budget}",COV_S), Spacer(1,1.2*cm),
          Paragraph("Documento técnico · Uso interno / Agencia",COV_S), Spacer(1,3*cm),
          Paragraph(f"Preparado por el equipo de Ads · {m['date']}",SMALL), PageBreak()]

    # TESIS + POLÍTICAS
    s.append(Paragraph("1. Tesis Estratégica", H1))
    s.append(callout(a['thesis'])); s.append(Spacer(1,10))
    s.append(Paragraph("2. Políticas de Google Ads Aplicables", H1))
    s.append(Paragraph("Todos los copies han sido diseñados en cumplimiento de estas políticas:", BODY))
    pol_data = [["Política","Aplicación en este cliente"]] + [[p['policy'],p['application']] for p in a['policies']]
    s.append(tabla(pol_data,[4*cm,12.5*cm])); s.append(PageBreak())

    # CAMPAÑAS
    for ci, camp in enumerate(a['campaigns']):
        s.append(Paragraph(camp['name'], H1))
        meta_data = [["Intención","Volumen objetivo","CPC estimado"],
                     [camp['intent'], camp['volumeTarget'], camp['cpcRange']]]
        s.append(tabla(meta_data,[5.5*cm,5.5*cm,5.5*cm]))
        s.append(Spacer(1,8))

        s.append(Paragraph("Grupos de anuncios y Keywords", H2))
        for ag in camp['adGroups']:
            s.append(Paragraph(f"<b>{ag['name']}</b> → Landing: <i>{ag['landing']}</i>", BODY))
            s.append(kw_chips(ag['keywords']))
            s.append(Spacer(1,6))

        s.append(Paragraph("Ad Copy RSA — Titulares (máx. 30 car.)", H3))
        h = camp['adCopy']['headlines']
        h_rows = [h[i:i+3] for i in range(0,len(h),3)]
        while h_rows and len(h_rows[-1])<3: h_rows[-1].append("")
        s.append(tabla([[f"T{i*3+j+1}: {h_rows[i][j]}" if h_rows[i][j] else "" for j in range(3)] for i in range(len(h_rows))],
                       [5.5*cm,5.5*cm,5.5*cm], header_bg=CEL))

        s.append(Paragraph("Descripciones (máx. 90 car.)", H3))
        s.append(bullets(camp['adCopy']['descriptions']))
        s.append(Paragraph("Extensiones recomendadas", H3))
        s.append(bullets(camp['extensions']))
        s.append(PageBreak())

    # PRESUPUESTO
    s.append(Paragraph("6. Escenarios de Presupuesto", H1))
    bud_data = [["Escenario","Total/mes","C1 Síntomas","C2 Servicios","C3 Marca","Clicks est."]] + \
               [[b['name'],b['total'],b['c1'],b['c2'],b['c3'],b['clicksEstimate']] for b in a['budgetScenarios']]
    s.append(tabla(bud_data,[2.5*cm,3*cm,3*cm,3*cm,2.5*cm,2.5*cm]))

    # TARGETING
    s.append(Paragraph("7. Targeting", H1))
    s.append(Paragraph("Ubicaciones:", H3)); s.append(bullets(a['targeting']['locations']))
    s.append(Paragraph("Dispositivos:", H3)); s.append(Paragraph(a['targeting']['devices'],BODY))
    s.append(Paragraph("Horario:", H3)); s.append(Paragraph(a['targeting']['schedule'],BODY))
    s.append(Paragraph("Audiencias (RLSA):", H3)); s.append(bullets(a['targeting']['audiences']))
    s.append(PageBreak())

    # MEDICIÓN
    s.append(Paragraph("8. Medición y Conversiones", H1))
    s.append(Paragraph(f"Stack: {' · '.join(a['measurement']['stack'])}", BODY))
    ev_data = [["Evento","Categoría","Trigger / Cómo medir"]] + \
              [[e['event'],e['category'],e['trigger']] for e in a['measurement']['events']]
    s.append(tabla(ev_data,[3.5*cm,2.5*cm,10.5*cm]))

    # NEGATIVOS
    s.append(Paragraph("9. Keywords Negativas", H1))
    s.append(Paragraph("Lista global:", H3))
    s.append(Paragraph(' · '.join(a['negatives']['global']), BODY))
    s.append(Paragraph("Por campaña:", H3))
    for bc in a['negatives']['byCampaign']:
        s.append(Paragraph(f"<b>{bc['campaign']}:</b> {' · '.join(bc['items'])}", BODY))

    s.append(Spacer(1,12))
    s.append(callout("<b>Implementar medición correctamente desde el día 1 es lo más importante. "
                     "Sin datos no hay optimización. Configura GA4 + GTM antes de activar los anuncios.</b>", VERDE))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_ads_agencia.py <data.json> <output.pdf>"); sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f: data = json.load(f)
    build(data, sys.argv[2])
