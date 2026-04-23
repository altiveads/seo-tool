"""
ALTIVE TOOLS — PDF Meta Ads CLIENTE
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
AZUL_SUAVE = colors.HexColor("#E8F4FD")

_ss = getSampleStyleSheet()
H1   = ParagraphStyle('H1',  fontName='Helvetica-Bold', fontSize=22, textColor=AZUL,
                      spaceAfter=14, spaceBefore=8, leading=26)
H3   = ParagraphStyle('H3',  fontName='Helvetica-Bold', fontSize=12, textColor=AZUL,
                      spaceAfter=6,  spaceBefore=8, leading=15)
BODY = ParagraphStyle('BODY', fontName='Helvetica', fontSize=11, textColor=GRIS,
                      alignment=TA_JUSTIFY, leading=15, spaceAfter=7)
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
COPY_H = ParagraphStyle('CPH', fontName='Helvetica-Bold', fontSize=12, textColor=AZUL,
                         leading=15, spaceAfter=4)
COPY_B = ParagraphStyle('CPB', fontName='Helvetica', fontSize=10, textColor=GRIS,
                         leading=14, spaceAfter=4)

def footer(canvas, doc):
    m = doc.altive_meta
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GRIS)
    canvas.drawString(2*cm, 1.2*cm, f"Meta Ads · {m['clientName']}")
    canvas.drawRightString(A4[0]-2*cm, 1.2*cm, f"Pág. {doc.page}")
    canvas.setStrokeColor(BORDE)
    canvas.line(2*cm, 1.5*cm, A4[0]-2*cm, 1.5*cm)
    canvas.restoreState()

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

def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(str(i), BODY), leftIndent=12, value='circle') for i in items],
        bulletType='bullet', start='circle', leftIndent=14
    )

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
    s.append(Paragraph(cov.get('title', 'Cómo vamos a llegar a más personas'), COV_T))
    s.append(Paragraph(m['clientName'], COV_S))
    s.append(Spacer(1, 0.8*cm))
    s.append(Paragraph(cov.get('subtitle', ''), COV_S))
    s.append(Spacer(1, 3*cm))
    s.append(Paragraph(f"Preparado por Altive · {m['date']}", SMALL))
    s.append(PageBreak())

    # ── LA IDEA ────────────────────────────────────────────────────────────
    s.append(Paragraph("La idea en pocas palabras", H1))
    if c.get('theIdea'):
        s.append(callout(c['theIdea'], CEL))
    s.append(PageBreak())

    # ── CÓMO FUNCIONA ──────────────────────────────────────────────────────
    hw = c.get('howItWorks', {})
    s.append(Paragraph("¿Cómo funciona esto?", H1))
    for p in hw.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    if hw.get('steps'):
        s.append(Spacer(1, 8))
        for i, step in enumerate(hw['steps'], 1):
            t = Table([[
                Paragraph(f"<b>{i}</b>", CELL_H),
                Paragraph(str(step), BODY),
            ]], colWidths=[1.5*cm, 15*cm])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (0,-1), CEL),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LINEBELOW', (0,0), (-1,-1), 0.3, BORDE),
            ]))
            s.append(t)
            s.append(Spacer(1, 3))
    s.append(PageBreak())

    # ── EJEMPLOS DE ANUNCIOS ───────────────────────────────────────────────
    ads = c.get('adExamples', [])
    if ads:
        s.append(Paragraph("Así se verán algunos anuncios", H1))
        s.append(Paragraph("Estos son ejemplos reales de los textos que publicaremos:", BODY))
        s.append(Spacer(1, 8))
        for ad in ads:
            ad_t = Table([[
                Paragraph(f"<b>{ad.get('headline','')}</b>", COPY_H),
            ]], colWidths=[16.5*cm])
            ad_t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), AZUL_SUAVE),
                ('LINEBEFORE', (0,0), (0,-1), 4, CEL),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            body_t = Table([[
                Paragraph(ad.get('body', ''), COPY_B),
            ]], colWidths=[16.5*cm])
            body_t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), AZUL_SUAVE),
                ('LINEBEFORE', (0,0), (0,-1), 4, CEL),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ]))
            cta_t = Table([[
                Paragraph(f"Botón: <b>{ad.get('cta','')}</b>", CELL),
            ]], colWidths=[16.5*cm])
            cta_t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), CEL),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ]))
            s.extend([ad_t, body_t, cta_t, Spacer(1, 12)])
        s.append(PageBreak())

    # ── INVERSIÓN ──────────────────────────────────────────────────────────
    inv = c.get('investment', {})
    s.append(Paragraph("La inversión y cómo se usa", H1))
    s.append(Paragraph(f"<b>Inversión mensual:</b> {inv.get('amount','')}", BODY))
    if inv.get('distribution'):
        s.append(Spacer(1, 6))
        s.append(bullets(inv['distribution']))
    s.append(PageBreak())

    # ── RESULTADOS ESPERADOS ───────────────────────────────────────────────
    er = c.get('expectedResults', {})
    s.append(Paragraph("¿Qué puedes esperar?", H1))
    for p in er.get('paragraphs', []):
        s.append(Paragraph(p, BODY))
    metrics = er.get('metrics', [])
    if metrics:
        s.append(Spacer(1, 8))
        m_data = [["Resultado", "Descripción"]] + \
                 [[mt.get('metric',''), mt.get('description','')] for mt in metrics]
        t_m = tabla(m_data, [5*cm, 11.5*cm])
        s.append(t_m)
    s.append(PageBreak())

    # ── LO QUE NECESITAMOS ─────────────────────────────────────────────────
    s.append(Paragraph("Lo que necesitamos de ti", H1))
    s.append(bullets(c.get('whatWeNeedFromYou', [])))
    s.append(Spacer(1, 12))
    s.append(Paragraph("Nuestro compromiso contigo", H1))
    s.append(bullets(c.get('ourCommitment', [])))
    s.append(PageBreak())

    # ── CIERRE ─────────────────────────────────────────────────────────────
    s.append(Spacer(1, 2*cm))
    if c.get('closing'):
        s.append(callout(c['closing'], VERDE))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_meta_ads_cliente.py <data.json> <output.pdf>")
        sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f:
        data = json.load(f)
    build(data, sys.argv[2])
