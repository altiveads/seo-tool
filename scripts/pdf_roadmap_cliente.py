"""
ALTIVE TOOLS — PDF Roadmap CLIENTE
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
VERDE_F = colors.HexColor("#E8F8F5")
NAR_F   = colors.HexColor("#FEF3E2")

MES_COLORS = [CEL, VERDE, NAR]
MES_FONDES = [FONDO, VERDE_F, NAR_F]
MES_THEMES = ["Construimos la base", "Encendemos la pauta", "Optimizamos y escalamos"]

_ss = getSampleStyleSheet()
H1   = ParagraphStyle('H1',  fontName='Helvetica-Bold', fontSize=22, textColor=AZUL,
                      spaceAfter=14, spaceBefore=8, leading=26)
H3   = ParagraphStyle('H3',  fontName='Helvetica-Bold', fontSize=12, textColor=AZUL,
                      spaceAfter=6,  spaceBefore=8, leading=15)
BODY = ParagraphStyle('BODY', fontName='Helvetica', fontSize=11, textColor=GRIS,
                      alignment=TA_JUSTIFY, leading=15, spaceAfter=7)
BODY_ITEM = ParagraphStyle('BI', fontName='Helvetica', fontSize=10.5, textColor=GRIS,
                      leading=14, spaceAfter=3)
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
    canvas.drawString(2*cm, 1.2*cm, f"Plan de Crecimiento Digital · {m['clientName']}")
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
        [ListItem(Paragraph(str(i), BODY_ITEM), leftIndent=12, value='circle') for i in items],
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

def render_month_client(month_data, index):
    """Renders a simplified month block for the client."""
    els = []
    mes_color = MES_COLORS[index % 3]
    mes_fondo = MES_FONDES[index % 3]

    month_name = month_data.get('month', f'Mes {index+1}')
    theme      = month_data.get('theme', MES_THEMES[index % 3])
    actions    = month_data.get('whatWeWillDo', [])
    result     = month_data.get('whatYouWillSee', '')

    # Month header
    hdr = Table([[
        Paragraph(f"<b>{month_name}</b>", CELL_H),
        Paragraph(f"<b>{theme}</b>", CELL_H),
    ]], colWidths=[3.5*cm, 13*cm])
    hdr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), mes_color),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    els.append(hdr)

    # Actions
    for act in actions:
        row_t = Table([[
            Paragraph(f"• {act}", BODY_ITEM),
        ]], colWidths=[16.5*cm])
        row_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), mes_fondo),
            ('LEFTPADDING', (0,0), (-1,-1), 14),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LINEBELOW', (0,0), (-1,-1), 0.3, BORDE),
        ]))
        els.append(row_t)

    # Result
    if result:
        result_t = Table([[
            Paragraph("✅ Al terminar el mes:", CELL_H),
            Paragraph(result, CELL),
        ]], colWidths=[4*cm, 12.5*cm])
        result_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), VERDE),
            ('BACKGROUND', (1,0), (1,-1), VERDE_F),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        els.append(result_t)

    els.append(Spacer(1, 12))
    return els

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
    s.append(Paragraph(cov.get('title', 'Tu plan de crecimiento digital'), COV_T))
    s.append(Paragraph(m['clientName'], COV_S))
    s.append(Spacer(1, 0.8*cm))
    s.append(Paragraph(cov.get('subtitle', 'Próximos 3 meses'), COV_S))
    s.append(Spacer(1, 3*cm))
    s.append(Paragraph(f"Preparado por Altive · {m['date']}", SMALL))
    s.append(PageBreak())

    # ── VISIÓN ─────────────────────────────────────────────────────────────
    s.append(Paragraph("¿Qué vamos a lograr juntos?", H1))
    if c.get('vision'):
        s.append(callout(c['vision'], CEL))
    s.append(PageBreak())

    # ── PLAN MES A MES ─────────────────────────────────────────────────────
    s.append(Paragraph("El plan mes a mes", H1))
    months = c.get('months', [])
    for idx, month in enumerate(months):
        s.extend(render_month_client(month, idx))
    s.append(PageBreak())

    # ── QUICK WINS ─────────────────────────────────────────────────────────
    qws = c.get('quickWins', [])
    if qws:
        s.append(Paragraph("Lo que hacemos primero (semanas 1-2)", H1))
        for qw in qws:
            t = Table([[
                Paragraph(f"<b>{qw.get('action','')}</b>", CELL_H),
            ]], colWidths=[16.5*cm])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), AZUL),
                ('LEFTPADDING', (0,0), (-1,-1), 10),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            impact_t = Table([[
                Paragraph(f"💡 {qw.get('impact','')}", BODY_ITEM),
            ]], colWidths=[16.5*cm])
            impact_t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), FONDO),
                ('LINEBEFORE', (0,0), (0,-1), 3, NAR),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ]))
            s.extend([t, impact_t, Spacer(1, 6)])
        s.append(PageBreak())

    # ── TU ROL ─────────────────────────────────────────────────────────────
    your_role = c.get('yourRole', [])
    if your_role:
        s.append(Paragraph("Lo que necesitamos de ti", H1))
        s.append(bullets(your_role))
        s.append(PageBreak())

    # ── INVERSIÓN ──────────────────────────────────────────────────────────
    inv = c.get('investment', [])
    if inv:
        s.append(Paragraph("La inversión del trimestre", H1))
        inv_data = [["Período", "Inversión total", "Distribución de canales"]] + \
                   [[i.get('month',''), i.get('total',''), i.get('channels','')] for i in inv]
        s.append(tabla(inv_data, [3*cm, 4*cm, 9.5*cm]))
        s.append(PageBreak())

    # ── RESULTADOS ESPERADOS ───────────────────────────────────────────────
    results = c.get('expectedResults', [])
    if results:
        s.append(Paragraph("¿Qué puedes esperar ver?", H1))
        res_data = [["Resultado", "Mes 1", "Mes 2", "Mes 3"]] + \
                   [[r.get('metric',''), r.get('m1',''), r.get('m2',''), r.get('m3','')] for r in results]
        s.append(tabla(res_data, [7.5*cm, 3*cm, 3*cm, 3*cm]))
        s.append(PageBreak())

    # ── CIERRE ─────────────────────────────────────────────────────────────
    s.append(Spacer(1, 2*cm))
    if c.get('closing'):
        s.append(callout(c['closing'], VERDE))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_roadmap_cliente.py <data.json> <output.pdf>")
        sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f:
        data = json.load(f)
    build(data, sys.argv[2])
