"""
ALTIVE TOOLS — PDF Market Research AGENCIA
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

AZUL  = colors.HexColor("#0B3B5F")
CEL   = colors.HexColor("#2E86AB")
GRIS  = colors.HexColor("#4A4A4A")
VERDE = colors.HexColor("#1E8449")
NAR   = colors.HexColor("#E67E22")
ROJO  = colors.HexColor("#C0392B")
FONDO = colors.HexColor("#F4F7FA")
BORDE = colors.HexColor("#D0D7DE")

_ss = getSampleStyleSheet()
H1   = ParagraphStyle('H1',  fontName='Helvetica-Bold', fontSize=22, textColor=AZUL,
                      spaceAfter=14, spaceBefore=8, leading=26)
H2   = ParagraphStyle('H2',  fontName='Helvetica-Bold', fontSize=15, textColor=CEL,
                      spaceAfter=8,  spaceBefore=14, leading=19)
H3   = ParagraphStyle('H3',  fontName='Helvetica-Bold', fontSize=12, textColor=AZUL,
                      spaceAfter=6,  spaceBefore=8, leading=15)
BODY = ParagraphStyle('BODY', fontName='Helvetica', fontSize=10, textColor=GRIS,
                      alignment=TA_JUSTIFY, leading=14, spaceAfter=6)
SMALL= ParagraphStyle('SML', fontName='Helvetica', fontSize=9, textColor=GRIS,
                      alignment=TA_CENTER, leading=12)
COV_T= ParagraphStyle('COVT', fontName='Helvetica-Bold', fontSize=32, textColor=AZUL,
                       alignment=TA_CENTER, leading=38, spaceAfter=12)
COV_S= ParagraphStyle('COVS', fontName='Helvetica', fontSize=14, textColor=CEL,
                       alignment=TA_CENTER, leading=20, spaceAfter=8)
CAL_S= ParagraphStyle('CAL',  fontName='Helvetica', fontSize=10, textColor=AZUL,
                       backColor=FONDO, borderPadding=8, leading=14)
CELL = ParagraphStyle('CELL', fontName='Helvetica',      fontSize=8.5, textColor=GRIS,
                       alignment=TA_LEFT, leading=11)
CELL_H=ParagraphStyle('CELLH',fontName='Helvetica-Bold', fontSize=9, textColor=colors.white,
                       alignment=TA_CENTER, leading=11)

def footer(canvas, doc):
    m = doc.altive_meta
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GRIS)
    canvas.drawString(2*cm, 1.2*cm,
        f"Market Research · {m['clientName']} · Documento interno / Agencia")
    canvas.drawRightString(A4[0]-2*cm, 1.2*cm, f"Pág. {doc.page}")
    canvas.setStrokeColor(BORDE)
    canvas.line(2*cm, 1.5*cm, A4[0]-2*cm, 1.5*cm)
    canvas.restoreState()

def _wrap(data):
    out = []
    for ri, row in enumerate(data):
        nrow = []
        for cell in row:
            if hasattr(cell, 'wrap'):
                nrow.append(cell)
            else:
                nrow.append(Paragraph(str(cell), CELL_H if ri == 0 else CELL))
        out.append(nrow)
    return out

def tabla(data, col_widths, header_bg=AZUL):
    t = Table(_wrap(data), colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0),  header_bg),
        ('TEXTCOLOR',     (0,0), (-1,0),  colors.white),
        ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
        ('FONTNAME',      (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',     (0,1), (-1,-1), GRIS),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('ALIGN',         (0,0), (-1,0),  'CENTER'),
        ('ALIGN',         (0,1), (-1,-1), 'LEFT'),
        ('GRID',          (0,0), (-1,-1), 0.4, BORDE),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [colors.white, FONDO]),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    return t

def callout(text, color=CEL):
    t = Table([[Paragraph(text, CAL_S)]], colWidths=[16.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,-1), FONDO),
        ('LINEBEFORE',   (0,0), (0,-1),  3, color),
        ('LEFTPADDING',  (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING',   (0,0), (-1,-1), 8),
        ('BOTTOMPADDING',(0,0), (-1,-1), 8),
    ]))
    return t

def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(str(i), BODY), leftIndent=10, value='circle') for i in items],
        bulletType='bullet', start='circle', leftIndent=12
    )

def impact_color(impact):
    s = str(impact).lower()
    if 'alta' in s or 'alto' in s: return ROJO
    if 'media' in s or 'medio' in s: return NAR
    return VERDE

def build(d, output_path):
    m = d['meta']
    a = d['agency']

    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=1.8*cm, bottomMargin=2*cm)
    doc.altive_meta = m
    s = []

    # ── PORTADA ────────────────────────────────────────────────────────────
    s.append(Spacer(1, 4*cm))
    s.append(Paragraph("INVESTIGACIÓN DE MERCADO", COV_T))
    s.append(Paragraph(m['clientName'], COV_S))
    s.append(Spacer(1, 0.6*cm))
    s.append(Paragraph(f"Mercado: {m.get('city','')}{' · ' + m['sector'] if m.get('sector') else ''}", COV_S))
    s.append(Spacer(1, 1.2*cm))
    s.append(Paragraph("Documento técnico · Uso interno / Agencia", COV_S))
    s.append(Spacer(1, 3*cm))
    s.append(Paragraph(f"Preparado por el equipo de Market Intelligence · {m['date']}", SMALL))
    s.append(PageBreak())

    # ── 1. RESUMEN EJECUTIVO ───────────────────────────────────────────────
    s.append(Paragraph("1. Resumen Ejecutivo", H1))
    for p in a.get('executiveSummary', {}).get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    s.append(Spacer(1, 8))
    s.append(Paragraph("Hallazgos clave del período", H3))
    s.append(bullets(a.get('executiveSummary', {}).get('keyFindings', [])))
    s.append(Spacer(1, 8))
    if a.get('executiveSummary', {}).get('callout'):
        s.append(callout(a['executiveSummary']['callout'], CEL))
    s.append(PageBreak())

    # ── 2. CONTEXTO Y DISEÑO ──────────────────────────────────────────────
    s.append(Paragraph("2. Contexto del Negocio y Diseño de la Investigación", H1))
    bc = a.get('businessContext', {})
    for p in bc.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    if bc.get('problemStatement'):
        s.append(Spacer(1, 6))
        s.append(Paragraph(f"<b>Problema de negocio:</b> {bc['problemStatement']}", BODY))

    s.append(Spacer(1, 10))
    s.append(Paragraph("2.1 Objetivos y preguntas de investigación", H3))
    meth = a.get('methodology', {})
    if meth.get('general'):
        s.append(Paragraph(f"<b>Objetivo general:</b> {meth['general']}", BODY))
    if meth.get('specific'):
        s.append(Paragraph("Objetivos específicos:", H3))
        s.append(bullets(meth['specific']))
    if meth.get('questions'):
        s.append(Paragraph("Preguntas de investigación:", H3))
        s.append(bullets(meth['questions']))
    if meth.get('scope'):
        s.append(Paragraph("Alcance:", H3))
        s.append(bullets(meth['scope']))
    if meth.get('limitations'):
        s.append(Paragraph("Limitaciones metodológicas:", H3))
        s.append(bullets(meth['limitations']))
    s.append(PageBreak())

    # ── 3. ANÁLISIS DEL MERCADO ────────────────────────────────────────────
    s.append(Paragraph("3. Análisis del Mercado", H1))
    ma = a.get('marketAnalysis', {})
    for p in ma.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    if ma.get('size'):
        s.append(Paragraph(f"<b>Tamaño estimado del mercado local:</b> {ma['size']}", BODY))
    s.append(Spacer(1, 8))

    if ma.get('trends'):
        s.append(Paragraph("3.1 Tendencias del mercado", H3))
        trend_data = [["Tendencia", "Impacto"]] + \
                     [[t.get('trend',''), t.get('impact','')] for t in ma['trends']]
        s.append(tabla(trend_data, [13.5*cm, 3*cm]))
        s.append(Spacer(1, 8))

    if ma.get('drivers'):
        s.append(Paragraph("3.2 Drivers de crecimiento", H3))
        s.append(bullets(ma['drivers']))
    if ma.get('barriers'):
        s.append(Paragraph("3.3 Barreras del mercado", H3))
        s.append(bullets(ma['barriers']))
    if ma.get('callout'):
        s.append(Spacer(1, 8))
        s.append(callout(ma['callout'], CEL))
    s.append(PageBreak())

    # ── 4. ANÁLISIS DE LA DEMANDA ──────────────────────────────────────────
    s.append(Paragraph("4. Análisis de la Demanda y el Consumidor", H1))
    da = a.get('demandAnalysis', {})
    for p in da.get('paragraphs', []):
        s.append(Paragraph(p, BODY))

    if da.get('segments'):
        s.append(Paragraph("4.1 Segmentos relevantes", H3))
        seg_data = [["Segmento", "Necesidad principal", "Urgencia"]] + \
                   [[sg.get('name',''), sg.get('needs',''), sg.get('urgency','')] for sg in da['segments']]
        s.append(tabla(seg_data, [4*cm, 9.5*cm, 3*cm]))
        s.append(Spacer(1, 8))

    if da.get('motivations'):
        s.append(Paragraph("4.2 Motivaciones de compra", H3))
        s.append(bullets(da['motivations']))
    if da.get('fears'):
        s.append(Paragraph("4.3 Miedos y barreras", H3))
        s.append(bullets(da['fears']))
    if da.get('decisionCriteria'):
        s.append(Paragraph("4.4 Criterios de decisión", H3))
        s.append(bullets(da['decisionCriteria']))
    if da.get('callout'):
        s.append(Spacer(1, 8))
        s.append(callout(da['callout'], NAR))
    s.append(PageBreak())

    # ── 5. ANÁLISIS COMPETITIVO ────────────────────────────────────────────
    s.append(Paragraph("5. Análisis Competitivo", H1))
    ca = a.get('competitiveAnalysis', {})
    for p in ca.get('paragraphs', []):
        s.append(Paragraph(p, BODY))

    if ca.get('competitors'):
        s.append(Paragraph("5.1 Mapa competitivo", H3))
        comp_data = [["Competidor", "Posicionamiento", "Fortaleza", "Debilidad", "Amenaza"]] + \
                    [[c.get('name',''), c.get('positioning',''), c.get('strength',''),
                      c.get('weakness',''), c.get('threat','')] for c in ca['competitors']]
        s.append(tabla(comp_data, [3*cm, 4*cm, 3.5*cm, 3.5*cm, 2.5*cm]))
        s.append(Spacer(1, 8))

    if ca.get('gaps'):
        s.append(Paragraph("5.2 Gaps y oportunidades de diferenciación", H3))
        s.append(bullets(ca['gaps']))
    if ca.get('callout'):
        s.append(Spacer(1, 8))
        s.append(callout(ca['callout'], VERDE))
    s.append(PageBreak())

    # ── 6. HALLAZGOS CLAVE ─────────────────────────────────────────────────
    s.append(Paragraph("6. Hallazgos Clave", H1))
    findings = a.get('keyFindings', [])
    if findings:
        kf_data = [["Hallazgo", "Evidencia", "Implicación"]] + \
                  [[f.get('finding',''), f.get('evidence',''), f.get('implication','')] for f in findings]
        s.append(tabla(kf_data, [5.5*cm, 5.5*cm, 5.5*cm]))
    s.append(PageBreak())

    # ── 7. INSIGHTS ESTRATÉGICOS ───────────────────────────────────────────
    s.append(Paragraph("7. Insights Estratégicos", H1))
    insights = a.get('strategicInsights', [])
    for i, ins in enumerate(insights, 1):
        s.append(Paragraph(f"<b>Insight {i} — {ins.get('type','').upper()}</b>", H3))
        s.append(Paragraph(ins.get('insight',''), BODY))
        if ins.get('implication'):
            s.append(Paragraph(f"<i>Implicación:</i> {ins['implication']}", BODY))
        s.append(Spacer(1, 6))
    s.append(PageBreak())

    # ── 8. RECOMENDACIONES ─────────────────────────────────────────────────
    s.append(Paragraph("8. Recomendaciones Priorizadas", H1))
    recs = a.get('recommendations', [])
    if recs:
        rec_data = [["Recomendación", "Tipo", "Por qué", "Impacto", "Prioridad", "Riesgo"]] + \
                   [[r.get('recommendation',''), r.get('type',''), r.get('why',''),
                     r.get('impact',''), r.get('priority',''), r.get('risk','')] for r in recs]
        s.append(tabla(rec_data, [4.5*cm, 2*cm, 3*cm, 2.5*cm, 1.5*cm, 3*cm]))
    s.append(Spacer(1, 10))
    s.append(Paragraph("8.1 Próximos pasos", H3))
    s.append(bullets(a.get('nextSteps', [])))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_market_research_agencia.py <data.json> <output.pdf>")
        sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f:
        data = json.load(f)
    build(data, sys.argv[2])
