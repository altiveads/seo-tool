"""
ALTIVE TOOLS — PDF Meta Ads Strategy AGENCIA
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
MORA  = colors.HexColor("#6C3483")
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
COV_T= ParagraphStyle('COVT', fontName='Helvetica-Bold', fontSize=30, textColor=AZUL,
                       alignment=TA_CENTER, leading=36, spaceAfter=12)
COV_S= ParagraphStyle('COVS', fontName='Helvetica', fontSize=14, textColor=CEL,
                       alignment=TA_CENTER, leading=20, spaceAfter=8)
CAL_S= ParagraphStyle('CAL',  fontName='Helvetica', fontSize=10, textColor=AZUL,
                       backColor=FONDO, borderPadding=8, leading=14)
CELL = ParagraphStyle('CELL', fontName='Helvetica',      fontSize=8.5, textColor=GRIS,
                       alignment=TA_LEFT, leading=11)
CELL_H=ParagraphStyle('CELLH',fontName='Helvetica-Bold', fontSize=9, textColor=colors.white,
                       alignment=TA_CENTER, leading=11)
COPY = ParagraphStyle('COPY', fontName='Helvetica', fontSize=9.5, textColor=GRIS,
                       leading=13, spaceAfter=4)

def footer(canvas, doc):
    m = doc.altive_meta
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GRIS)
    canvas.drawString(2*cm, 1.2*cm,
        f"Estrategia Meta Ads · {m['clientName']} · Documento interno / Agencia")
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

def ad_copy_block(copy_data, brief_data):
    """Renders a single ad copy + creative brief as a combined block."""
    num = copy_data.get('number', 0)
    angle = copy_data.get('angle', '')

    header_t = Table([[
        Paragraph(f"<b>Anuncio {num}</b>", CELL_H),
        Paragraph(f"Ángulo: {angle}", CELL_H),
    ]], colWidths=[3*cm, 14*cm])
    header_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), AZUL),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))

    content_rows = [
        ["TITULAR", copy_data.get('headline', '')],
        ["DESCRIPCIÓN", copy_data.get('description', '')],
        ["CTA", copy_data.get('cta', '')],
    ]
    content_t = Table(
        [[Paragraph(r[0], CELL_H), Paragraph(str(r[1]), CELL)] for r in content_rows],
        colWidths=[3*cm, 14*cm]
    )
    content_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), CEL),
        ('GRID', (0,0), (-1,-1), 0.3, BORDE),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))

    body_t = Table([[Paragraph(str(copy_data.get('body', '')), COPY)]], colWidths=[17*cm])
    body_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), FONDO),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEBEFORE', (0,0), (0,-1), 2, NAR),
    ]))

    result = [header_t, body_t, content_t, Spacer(1, 4)]

    if brief_data:
        brief_t = Table([[
            Paragraph(f"<b>BRIEF CREATIVO</b> — Tipo: {brief_data.get('type','')} | {brief_data.get('emotionPalette','')}", CELL_H),
        ]], colWidths=[17*cm])
        brief_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), MORA),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        concept_t = Table([[
            Paragraph(f"<b>Concepto:</b> {brief_data.get('concept','')}", CELL),
            Paragraph(f"<b>Elementos clave:</b> {' · '.join(brief_data.get('keyElements', []))}", CELL),
        ]], colWidths=[8.5*cm, 8.5*cm])
        concept_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8F0FC")),
            ('GRID', (0,0), (-1,-1), 0.3, BORDE),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        result += [brief_t, concept_t]

    result.append(Spacer(1, 12))
    return result

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
    s.append(Paragraph("ESTRATEGIA META ADS", COV_T))
    s.append(Paragraph(m['clientName'], COV_S))
    s.append(Spacer(1, 0.6*cm))
    s.append(Paragraph(f"Presupuesto: {m.get('budget', 'a definir')} · {m.get('city','')}", COV_S))
    s.append(Spacer(1, 1.2*cm))
    s.append(Paragraph("Metodología ALTIVE · Documento interno / Agencia", COV_S))
    s.append(Spacer(1, 3*cm))
    s.append(Paragraph(f"Preparado por el equipo de Paid Media · {m['date']}", SMALL))
    s.append(PageBreak())

    # ── 1. ANÁLISIS DEL NEGOCIO ────────────────────────────────────────────
    s.append(Paragraph("1. Análisis del Negocio y Contexto", H1))
    ba = a.get('businessAnalysis', {})
    for p in ba.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    if ba.get('callout'):
        s.append(Spacer(1, 8))
        s.append(callout(ba['callout'], CEL))

    s.append(Spacer(1, 10))
    s.append(Paragraph("1.1 Objetivo estratégico de la campaña", H3))
    co = a.get('campaignObjective', {})
    if co.get('strategic'):
        s.append(Paragraph(co['strategic'], BODY))
    if co.get('kpis'):
        s.append(Paragraph("KPIs de seguimiento:", H3))
        s.append(bullets(co['kpis']))
    s.append(PageBreak())

    # ── 2. PERFIL DEL CLIENTE IDEAL ────────────────────────────────────────
    s.append(Paragraph("2. Perfil del Cliente Ideal", H1))
    ic = a.get('idealClient', {})
    for p in ic.get('paragraphs', []):
        s.append(Paragraph(p, BODY))

    profile_rows = []
    if ic.get('desires'):
        profile_rows.append(["Deseos profundos", "\n".join(f"• {d}" for d in ic['desires'])])
    if ic.get('fears'):
        profile_rows.append(["Miedos y frenos", "\n".join(f"• {f}" for f in ic['fears'])])
    if ic.get('objections'):
        profile_rows.append(["Objeciones", "\n".join(f"• {o}" for o in ic['objections'])])
    if ic.get('activatingLanguage'):
        profile_rows.append(["Lenguaje activador", "\n".join(f"• {l}" for l in ic['activatingLanguage'])])

    if profile_rows:
        s.append(Spacer(1, 8))
        prof_t = Table(
            [[Paragraph(r[0], CELL_H), Paragraph(r[1], CELL)] for r in profile_rows],
            colWidths=[4*cm, 13*cm]
        )
        prof_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), CEL),
            ('BACKGROUND', (1,0), (1,-1), colors.white),
            ('ROWBACKGROUNDS', (1,0), (1,-1), [colors.white, FONDO]),
            ('GRID', (0,0), (-1,-1), 0.3, BORDE),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        s.append(prof_t)
    s.append(PageBreak())

    # ── 3. PROPUESTA DE VALOR Y ÁNGULO ─────────────────────────────────────
    s.append(Paragraph("3. Propuesta de Valor y Ángulo de Comunicación", H1))
    vp = a.get('valueProposition', {})
    for p in vp.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    if vp.get('promise'):
        s.append(callout(f"<b>Promesa central:</b> {vp['promise']}", VERDE))
    if vp.get('callout'):
        s.append(Spacer(1, 6))
        s.append(callout(vp['callout'], CEL))

    s.append(Spacer(1, 10))
    ca = a.get('communicationAngle', {})
    s.append(Paragraph(f"3.1 Ángulo elegido: <b>{ca.get('angle','').upper()}</b>", H3))
    if ca.get('justification'):
        s.append(Paragraph(ca['justification'], BODY))
    if ca.get('callout'):
        s.append(callout(ca['callout'], NAR))
    s.append(PageBreak())

    # ── 4. ANUNCIOS Y BRIEFS CREATIVOS ─────────────────────────────────────
    s.append(Paragraph("4. Los 10 Anuncios y Briefs Creativos", H1))
    s.append(Paragraph("Los mismos 10 anuncios se replican en los 3 conjuntos. La diferencia entre conjuntos es la lógica de distribución, no el contenido.", BODY))
    s.append(Spacer(1, 10))

    ad_copies   = a.get('adCopies', [])
    creative_briefs = a.get('creativeBriefs', [])
    brief_map = {b.get('number'): b for b in creative_briefs}

    for copy in ad_copies:
        num = copy.get('number', 0)
        brief = brief_map.get(num, None)
        elements = ad_copy_block(copy, brief)
        s.extend(elements)
        if num % 3 == 0:
            s.append(PageBreak())
    s.append(PageBreak())

    # ── 5. ESTRUCTURA DE CAMPAÑA ───────────────────────────────────────────
    s.append(Paragraph("5. Estructura de Campaña (Metodología ALTIVE)", H1))
    cs = a.get('campaignStructure', {})
    s.append(Paragraph(f"<b>Campaña:</b> {cs.get('campaignName','')}", BODY))
    s.append(Paragraph(f"<b>Presupuesto total:</b> {cs.get('totalBudget','')}", BODY))
    s.append(Spacer(1, 8))

    adsets = cs.get('adsets', [])
    if adsets:
        as_data = [["Conjunto", "Lógica de distribución", "Presupuesto"]] + \
                  [[a_.get('name',''), a_.get('logic',''), a_.get('budget','')] for a_ in adsets]
        s.append(tabla(as_data, [4.5*cm, 9.5*cm, 2.5*cm]))
    s.append(PageBreak())

    # ── 6. RECORRIDO DE CONVERSIÓN ─────────────────────────────────────────
    s.append(Paragraph("6. Recorrido de Conversión Post-Clic", H1))
    cj = a.get('conversionJourney', {})
    for p in cj.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    if cj.get('steps'):
        s.append(Paragraph("Pasos del recorrido:", H3))
        s.append(bullets(cj['steps']))
    if cj.get('commercialRecommendations'):
        s.append(Paragraph("Recomendaciones para la atención comercial:", H3))
        s.append(bullets(cj['commercialRecommendations']))
    s.append(PageBreak())

    # ── 7. MÉTRICAS Y OPTIMIZACIÓN ─────────────────────────────────────────
    s.append(Paragraph("7. Métricas de Éxito y Plan de Optimización", H1))
    sm = a.get('successMetrics', [])
    if sm:
        s.append(Paragraph("7.1 KPIs de seguimiento", H3))
        metrics_data = [["Métrica", "Primaria", "Benchmark referencial"]] + \
                       [[m_.get('metric',''), "✓" if m_.get('primary') else "—", m_.get('benchmark','')] for m_ in sm]
        s.append(tabla(metrics_data, [6*cm, 2.5*cm, 8*cm]))

    s.append(Spacer(1, 10))
    op = a.get('optimizationPlan', {})
    if op.get('week1Signals'):
        s.append(Paragraph("7.2 Señales a evaluar en los primeros 7 días", H3))
        s.append(bullets(op['week1Signals']))
    if op.get('decisionCriteria'):
        s.append(Paragraph("7.3 Criterios de decisión para ajustar", H3))
        s.append(bullets(op['decisionCriteria']))
    if op.get('doNotTouch'):
        s.append(Paragraph("7.4 Qué NO tocar en la fase inicial", H3))
        s.append(bullets(op['doNotTouch']))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_meta_ads_agencia.py <data.json> <output.pdf>")
        sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f:
        data = json.load(f)
    build(data, sys.argv[2])
