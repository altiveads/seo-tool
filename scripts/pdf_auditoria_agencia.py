"""
ALTIVE TOOLS — PDF Auditoría SEO AGENCIA (documento técnico)
Misma estructura visual que los PDFs de Vera Oftalmología.
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
                      spaceAfter=14, spaceBefore=8,  leading=26)
H2   = ParagraphStyle('H2',  fontName='Helvetica-Bold', fontSize=15, textColor=CEL,
                      spaceAfter=8,  spaceBefore=14, leading=19)
H3   = ParagraphStyle('H3',  fontName='Helvetica-Bold', fontSize=12, textColor=AZUL,
                      spaceAfter=6,  spaceBefore=8,  leading=15)
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
        f"Auditoría SEO · {m['clientName']} · Documento interno / Agencia")
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
        [ListItem(Paragraph(i, BODY), leftIndent=10, value='circle') for i in items],
        bulletType='bullet', start='circle', leftIndent=12
    )

def build(d, output_path):
    m = d['meta']
    a = d['agency']

    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=1.8*cm, bottomMargin=2*cm)
    doc.altive_meta = m
    s = []

    # ---- PORTADA ----
    s.append(Spacer(1, 4*cm))
    s.append(Paragraph("AUDITORÍA SEO INTEGRAL", COV_T))
    s.append(Paragraph(m['clientName'], COV_S))
    s.append(Paragraph(m['url'], COV_S))
    s.append(Spacer(1, 1.2*cm))
    s.append(Paragraph("Documento técnico · Uso interno / Agencia", COV_S))
    s.append(Spacer(1, 0.6*cm))
    s.append(Paragraph(f"Mercado objetivo: {m['city']} · {m['country']}", COV_S))
    s.append(Spacer(1, 3*cm))
    s.append(Paragraph(f"Preparado por el equipo de SEO · {m['date']}", SMALL))
    s.append(PageBreak())

    # ---- ÍNDICE ----
    s.append(Paragraph("Índice", H1))
    for item in a['index']:
        s.append(Paragraph(item, BODY))
    s.append(PageBreak())

    # ---- 1. RESUMEN EJECUTIVO ----
    s.append(Paragraph("1. Resumen Ejecutivo", H1))
    for p in a['executiveSummary']['paragraphs']:
        s.append(Paragraph(p, BODY))
    s.append(Spacer(1, 6))
    s.append(Paragraph(f"Diagnóstico global: <b>{a['executiveSummary']['diagnosis']}</b>", BODY))
    s.append(Spacer(1, 10))
    s.append(Paragraph("Top prioridades de impacto", H3))
    prio_data = [["#", "Prioridad", "Impacto", "Esfuerzo", "Ventana"]] + \
                [[str(p['rank']), p['title'], p['impact'], p['effort'], p['window']]
                 for p in a['executiveSummary']['priorities']]
    s.append(tabla(prio_data, [1*cm, 8.5*cm, 2*cm, 2*cm, 2.5*cm]))
    s.append(Spacer(1, 10))
    s.append(callout(a['executiveSummary']['callout'], CEL))
    s.append(PageBreak())

    # ---- 2. METODOLOGÍA ----
    s.append(Paragraph("2. Metodología y Alcance", H1))
    for p in a['methodology']['paragraphs']:
        s.append(Paragraph(p, BODY))
    s.append(Spacer(1, 6))
    s.append(Paragraph("Herramientas y fuentes", H3))
    s.append(bullets(a['methodology']['tools']))
    s.append(PageBreak())

    # ---- 3. CONTEXTO + COMPETIDORES ----
    s.append(Paragraph("3. Contexto del Negocio y Competencia Local", H1))
    for p in a['context']['paragraphs']:
        s.append(Paragraph(p, BODY))
    s.append(Spacer(1, 6))
    s.append(Paragraph("Mapa competitivo", H3))
    comp_data = [["Competidor", "Fortaleza SEO", "Debilidad", "Amenaza"]] + \
                [[c['name'], c['strength'], c['weakness'], c['threat']]
                 for c in a['context']['competitors']]
    s.append(tabla(comp_data, [3.2*cm, 5.2*cm, 5*cm, 2.8*cm]))
    s.append(Spacer(1, 8))
    s.append(callout(a['context']['callout']))
    s.append(PageBreak())

    # ---- 4. KEYWORD RESEARCH ----
    s.append(Paragraph("4. Investigación de Palabras Clave", H1))
    for p in a['keywords']['paragraphs']:
        s.append(Paragraph(p, BODY))

    s.append(Paragraph("4.1 Keywords transaccionales / comerciales", H3))
    tx_data = [["Keyword", "Intención", "Dificultad", "Volumen", "Prioridad"]] + \
              [[k['keyword'], k['intent'], k['difficulty'], k['volume'], k['priority']]
               for k in a['keywords']['transactional']]
    s.append(tabla(tx_data, [6.5*cm, 3*cm, 2*cm, 2.2*cm, 2*cm]))

    s.append(Spacer(1, 10))
    s.append(Paragraph("4.2 Keywords por síntoma / educacionales", H3))
    sy_data = [["Keyword", "Intención", "Dificultad", "Volumen"]] + \
              [[k['keyword'], k['intent'], k['difficulty'], k['volume']]
               for k in a['keywords']['symptoms']]
    s.append(tabla(sy_data, [7.8*cm, 2.8*cm, 2.5*cm, 2.5*cm]))

    s.append(Spacer(1, 10))
    s.append(Paragraph("4.3 Keywords de marca", H3))
    br_data = [["Keyword", "Objetivo"]] + \
              [[k['keyword'], k['objective']] for k in a['keywords']['brand']]
    s.append(tabla(br_data, [7.5*cm, 8.5*cm]))
    s.append(Spacer(1, 10))
    s.append(callout(a['keywords']['callout']))
    s.append(PageBreak())

    # ---- 5. ON-PAGE ----
    s.append(Paragraph("5. Auditoría On-Page", H1))
    s.append(Paragraph("5.1 Hallazgos principales", H3))
    op_data = [["Elemento", "Estado actual", "Problema", "Severidad"]] + \
              [[o['element'], o['current'], o['problem'], o['severity']]
               for o in a['onPage']['items']]
    s.append(tabla(op_data, [3.5*cm, 4.5*cm, 5.8*cm, 2.2*cm]))

    s.append(Spacer(1, 10))
    s.append(Paragraph("5.2 Plantillas recomendadas", H3))
    for tpl in a['onPage']['templates']:
        s.append(Paragraph(f"<b>{tpl['label']}:</b>", BODY))
        s.append(Paragraph(f"<i>{tpl['value']}</i>", CAL_S))
        s.append(Spacer(1, 4))
    s.append(PageBreak())

    # ---- 6. TÉCNICO ----
    s.append(Paragraph("6. Auditoría Técnica", H1))
    tech_data = [["Check", "Estado", "Detalle / Acción"]] + \
                [[t['check'], t['status'], t['detail']] for t in a['technical']]
    s.append(tabla(tech_data, [4.2*cm, 2.8*cm, 9*cm]))
    s.append(Spacer(1, 8))
    s.append(callout(a['technicalCallout']))
    s.append(PageBreak())

    # ---- 7. CONTENT GAP ----
    s.append(Paragraph("7. Análisis de Contenido y Brechas", H1))
    for p in a['contentGap']['paragraphs']:
        s.append(Paragraph(p, BODY))
    gap_data = [["Contenido propuesto", "Tipo", "Keyword objetivo", "Prioridad"]] + \
               [[g['url'], g['type'], g['keyword'], g['priority']]
                for g in a['contentGap']['items']]
    s.append(tabla(gap_data, [7.3*cm, 2.2*cm, 5.3*cm, 1.2*cm]))
    s.append(Spacer(1, 8))
    s.append(Paragraph("7.1 Topical clusters recomendados", H3))
    s.append(bullets(a['contentGap']['clusters']))
    s.append(PageBreak())

    # ---- 8. SEO LOCAL ----
    s.append(Paragraph("8. SEO Local (GBP + NAP)", H1))
    for p in a['localSeo']['paragraphs']:
        s.append(Paragraph(p, BODY))
    gbp_data = [["Checklist GBP", "Acción"]] + \
               [[g['item'], g['action']] for g in a['localSeo']['items']]
    s.append(tabla(gbp_data, [5.8*cm, 10*cm]))
    s.append(Spacer(1, 10))
    s.append(callout(a['localSeo']['callout']))
    s.append(PageBreak())

    # ---- 9. E-E-A-T ----
    s.append(Paragraph("9. Autoridad, Backlinks y E-E-A-T", H1))
    for p in a['eeat']['paragraphs']:
        s.append(Paragraph(p, BODY))
    s.append(Paragraph("9.1 Checklist E-E-A-T", H3))
    s.append(bullets(a['eeat']['checklist']))
    s.append(Spacer(1, 8))
    s.append(Paragraph("9.2 Estrategia de link building", H3))
    lb_data = [["Palanca", "Objetivo", "Prioridad"]] + \
              [[lb['lever'], lb['objective'], lb['priority']] for lb in a['eeat']['linkBuilding']]
    s.append(tabla(lb_data, [7.5*cm, 5.5*cm, 2*cm]))
    s.append(PageBreak())

    # ---- 10. BENCHMARK ----
    s.append(Paragraph("10. Benchmark vs. Competidores", H1))
    bm = a['benchmark']
    bm_data = [bm['headers']] + bm['rows']
    widths   = [float(w)*cm for w in bm['colWidths']]
    s.append(tabla(bm_data, widths))
    s.append(Spacer(1, 8))
    s.append(callout(bm['callout']))
    s.append(PageBreak())

    # ---- 11. PLAN DE ACCIÓN ----
    s.append(Paragraph("11. Plan de Acción Priorizado", H1))
    s.append(Paragraph("11.1 Quick Wins (primeros 30 días)", H3))
    qw_data = [["Acción", "Impacto", "Esfuerzo"]] + \
              [[q['action'], q['impact'], q['effort']] for q in a['actionPlan']['quickWins']]
    s.append(tabla(qw_data, [10.5*cm, 2.7*cm, 2.7*cm]))
    s.append(Spacer(1, 10))
    s.append(Paragraph("11.2 Inversiones Estratégicas (30-180 días)", H3))
    inv_data = [["Acción", "Impacto", "Esfuerzo"]] + \
               [[q['action'], q['impact'], q['effort']] for q in a['actionPlan']['strategic']]
    s.append(tabla(inv_data, [10.5*cm, 2.7*cm, 2.7*cm]))
    s.append(PageBreak())

    # ---- 12. KPIs + ROADMAP ----
    s.append(Paragraph("12. KPIs, Medición y Roadmap 6 meses", H1))
    s.append(Paragraph("12.1 KPIs rectores", H3))
    kpi_data = [["KPI", "Baseline (est.)", "Meta 3M", "Meta 6M"]] + \
               [[k['kpi'], k['baseline'], k['m3'], k['m6']] for k in a['kpis']]
    s.append(tabla(kpi_data, [6.5*cm, 3*cm, 3*cm, 3*cm]))
    s.append(Spacer(1, 10))
    s.append(Paragraph("12.2 Roadmap trimestral", H3))
    rd_data = [["Mes", "Foco principal", "Entregable clave"]] + \
              [[r['month'], r['focus'], r['deliverable']] for r in a['roadmap']]
    s.append(tabla(rd_data, [1.8*cm, 4.8*cm, 9.4*cm]))
    s.append(Spacer(1, 10))
    s.append(Paragraph("12.3 Stack recomendado", H3))
    s.append(bullets(a['stack']))
    s.append(PageBreak())

    # ---- 13. ANEXOS ----
    s.append(Paragraph("13. Anexos", H1))
    s.append(Paragraph("A. Cumplimiento YMYL y políticas de salud", H3))
    s.append(bullets(a['annexes']['ymyl']))
    s.append(Spacer(1, 8))
    s.append(Paragraph("B. Riesgos y mitigación", H3))
    risk_data = [["Riesgo", "Mitigación"]] + \
                [[r['risk'], r['mitigation']] for r in a['annexes']['risks']]
    s.append(tabla(risk_data, [5.5*cm, 10.3*cm]))
    s.append(Spacer(1, 10))
    s.append(Paragraph("C. Próximos pasos operativos", H3))
    s.append(bullets(a['annexes']['nextSteps']))
    s.append(Spacer(1, 12))
    s.append(callout(a['annexes']['closing'], VERDE))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_auditoria_agencia.py <data.json> <output.pdf>")
        sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f:
        data = json.load(f)
    build(data, sys.argv[2])
