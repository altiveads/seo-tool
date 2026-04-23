"""
ALTIVE TOOLS — PDF Market Research CLIENTE
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
FONDO = colors.HexColor("#F4F7FA")
BORDE = colors.HexColor("#D0D7DE")
VERDE_SUAVE = colors.HexColor("#E8F8F5")

_ss = getSampleStyleSheet()
H1   = ParagraphStyle('H1',  fontName='Helvetica-Bold', fontSize=22, textColor=AZUL,
                      spaceAfter=14, spaceBefore=8, leading=26)
H2   = ParagraphStyle('H2',  fontName='Helvetica-Bold', fontSize=15, textColor=CEL,
                      spaceAfter=8,  spaceBefore=14, leading=19)
H3   = ParagraphStyle('H3',  fontName='Helvetica-Bold', fontSize=12, textColor=AZUL,
                      spaceAfter=6,  spaceBefore=8, leading=15)
BODY = ParagraphStyle('BODY', fontName='Helvetica', fontSize=11, textColor=GRIS,
                      alignment=TA_JUSTIFY, leading=15, spaceAfter=7)
BODY_BIG = ParagraphStyle('BB', fontName='Helvetica', fontSize=12, textColor=GRIS,
                      leading=16, spaceAfter=8)
SMALL= ParagraphStyle('SML', fontName='Helvetica', fontSize=9, textColor=GRIS,
                      alignment=TA_CENTER, leading=12)
COV_T= ParagraphStyle('COVT', fontName='Helvetica-Bold', fontSize=30, textColor=AZUL,
                       alignment=TA_CENTER, leading=36, spaceAfter=12)
COV_S= ParagraphStyle('COVS', fontName='Helvetica', fontSize=14, textColor=CEL,
                       alignment=TA_CENTER, leading=20, spaceAfter=8)
CAL_S= ParagraphStyle('CAL',  fontName='Helvetica', fontSize=11, textColor=AZUL,
                       backColor=FONDO, borderPadding=8, leading=15)
CELL = ParagraphStyle('CELL', fontName='Helvetica',      fontSize=9, textColor=GRIS,
                       alignment=TA_LEFT, leading=12)
CELL_H=ParagraphStyle('CELLH',fontName='Helvetica-Bold', fontSize=9.5, textColor=colors.white,
                       alignment=TA_CENTER, leading=12)

def footer(canvas, doc):
    m = doc.altive_meta
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GRIS)
    canvas.drawString(2*cm, 1.2*cm, f"Investigación de Mercado · {m['clientName']}")
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

def tabla(data, col_widths):
    t = Table(_wrap(data), colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0),  AZUL),
        ('TEXTCOLOR',     (0,0), (-1,0),  colors.white),
        ('FONTNAME',      (0,1), (-1,-1), 'Helvetica'),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('GRID',          (0,0), (-1,-1), 0.4, BORDE),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [colors.white, FONDO]),
        ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ('RIGHTPADDING',  (0,0), (-1,-1), 8),
        ('TOPPADDING',    (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def callout(text, color=CEL):
    t = Table([[Paragraph(text, CAL_S)]], colWidths=[16.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,-1), FONDO),
        ('LINEBEFORE',   (0,0), (0,-1),  4, color),
        ('LEFTPADDING',  (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
        ('TOPPADDING',   (0,0), (-1,-1), 10),
        ('BOTTOMPADDING',(0,0), (-1,-1), 10),
    ]))
    return t

def bullets(items, color=CEL):
    return ListFlowable(
        [ListItem(Paragraph(str(i), BODY), leftIndent=12, value='circle') for i in items],
        bulletType='bullet', start='circle', leftIndent=14
    )

def card_row(items, label):
    """Renders a row of highlighted cards for strengths/opportunities."""
    rows = []
    for i, item in enumerate(items):
        bg = FONDO if i % 2 == 0 else VERDE_SUAVE
        t = Table([[Paragraph(str(item), BODY)]], colWidths=[16.5*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg),
            ('LEFTPADDING', (0,0), (-1,-1), 14),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LINEBEFORE', (0,0), (0,-1), 3, CEL),
        ]))
        rows.append(t)
        rows.append(Spacer(1, 4))
    return rows

def build(d, output_path):
    m = d['meta']
    c = d.get('client', {})

    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=1.8*cm, bottomMargin=2*cm)
    doc.altive_meta = m
    s = []

    # ── PORTADA ────────────────────────────────────────────────────────────
    s.append(Spacer(1, 4*cm))
    cov = c.get('cover', {})
    s.append(Paragraph(cov.get('title', 'Tu mercado hoy'), COV_T))
    s.append(Paragraph(m['clientName'], COV_S))
    s.append(Spacer(1, 0.8*cm))
    s.append(Paragraph(cov.get('subtitle', ''), COV_S))
    s.append(Spacer(1, 1*cm))
    if cov.get('tagline'):
        s.append(Paragraph(cov['tagline'], SMALL))
    s.append(Spacer(1, 3*cm))
    s.append(Paragraph(f"Preparado por Altive · {m['date']}", SMALL))
    s.append(PageBreak())

    # ── INTRO ──────────────────────────────────────────────────────────────
    intro = c.get('intro', {})
    s.append(Paragraph("¿Para qué sirve este documento?", H1))
    for p in intro.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    if intro.get('callout'):
        s.append(Spacer(1, 8))
        s.append(callout(intro['callout'], CEL))
    s.append(PageBreak())

    # ── OPORTUNIDAD DE MERCADO ─────────────────────────────────────────────
    mo = c.get('marketOpportunity', {})
    s.append(Paragraph(mo.get('title', 'La oportunidad en tu mercado'), H1))
    for p in mo.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    items = mo.get('items', [])
    if items:
        s.append(Spacer(1, 8))
        for item in items:
            t = Table([[
                Paragraph(f"<b>{item.get('title','')}</b>", BODY),
                Paragraph(item.get('description',''), BODY)
            ]], colWidths=[5*cm, 11.5*cm])
            t.setStyle(TableStyle([
                ('VALIGN',        (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING',   (0,0), (-1,-1), 8),
                ('TOPPADDING',    (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('BACKGROUND',    (0,0), (0,-1), FONDO),
                ('LINEAFTER',     (0,0), (0,-1), 0.5, BORDE),
            ]))
            s.append(t)
            s.append(Spacer(1, 5))
    s.append(PageBreak())

    # ── TU POSICIÓN EN EL MERCADO ──────────────────────────────────────────
    yp = c.get('yourPosition', {})
    s.append(Paragraph(yp.get('title', '¿Dónde estás parado?'), H1))
    for p in yp.get('paragraphs', []):
        s.append(Paragraph(p, BODY))

    if yp.get('strengths'):
        s.append(Spacer(1, 8))
        s.append(Paragraph("Lo que está a tu favor:", H3))
        s.extend(card_row(yp['strengths'], 'strength'))

    if yp.get('opportunities'):
        s.append(Spacer(1, 8))
        s.append(Paragraph("Oportunidades para aprovechar:", H3))
        s.extend(card_row(yp['opportunities'], 'opportunity'))
    s.append(PageBreak())

    # ── RECOMENDACIONES ────────────────────────────────────────────────────
    tr = c.get('topRecommendations', {})
    s.append(Paragraph(tr.get('title', 'Las jugadas más importantes'), H1))
    for i, item in enumerate(tr.get('items', []), 1):
        priority = item.get('priority', 'Media')
        p_color = {'Alta': ROJO, 'Media': NAR, 'Baja': VERDE}.get(priority, NAR)
        t = Table([[
            Paragraph(f"<b>{i}. {item.get('title','')}</b>", BODY),
            Paragraph(f"<b>{priority}</b>", BODY)
        ]], colWidths=[13*cm, 3.5*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,0), FONDO),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('TOPPADDING',    (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LINEBEFORE',    (0,0), (0,-1), 4, p_color),
            ('TEXTCOLOR',     (1,0), (1,0), p_color),
        ]))
        s.append(t)
        why_t = Table([[Paragraph(item.get('why', ''), BODY)]], colWidths=[16.5*cm])
        why_t.setStyle(TableStyle([
            ('LEFTPADDING', (0,0), (-1,-1), 14),
            ('TOPPADDING',  (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        s.append(why_t)
        s.append(Spacer(1, 4))
    s.append(PageBreak())

    # ── CIERRE ─────────────────────────────────────────────────────────────
    cl = c.get('closing', {})
    s.append(Paragraph("¿Y ahora qué?", H1))
    for p in cl.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    if cl.get('callout'):
        s.append(Spacer(1, 10))
        s.append(callout(cl['callout'], VERDE))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_market_research_cliente.py <data.json> <output.pdf>")
        sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f:
        data = json.load(f)
    build(data, sys.argv[2])
