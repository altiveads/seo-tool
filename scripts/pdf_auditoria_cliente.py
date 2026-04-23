"""
ALTIVE TOOLS — PDF Auditoría SEO CLIENTE
Recibe un JSON por stdin o como archivo de argumento.
Genera el PDF en la ruta indicada dentro del JSON.
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

# ---------- PALETA ----------
AZUL  = colors.HexColor("#0B3B5F")
CEL   = colors.HexColor("#2E86AB")
GRIS  = colors.HexColor("#3D3D3D")
VERDE = colors.HexColor("#1E8449")
NAR   = colors.HexColor("#E67E22")
ROJO  = colors.HexColor("#C0392B")
FONDO = colors.HexColor("#EEF5FB")
BORDE = colors.HexColor("#CFD8E3")

# ---------- ESTILOS ----------
_ss = getSampleStyleSheet()
H1  = ParagraphStyle('H1',  fontName='Helvetica-Bold', fontSize=22, textColor=AZUL,
                     spaceAfter=14, spaceBefore=8,  leading=26)
H2  = ParagraphStyle('H2',  fontName='Helvetica-Bold', fontSize=16, textColor=CEL,
                     spaceAfter=8,  spaceBefore=14, leading=20)
H3  = ParagraphStyle('H3',  fontName='Helvetica-Bold', fontSize=13, textColor=AZUL,
                     spaceAfter=6,  spaceBefore=10, leading=16)
BODY = ParagraphStyle('BODY', fontName='Helvetica', fontSize=11, textColor=GRIS,
                      alignment=TA_JUSTIFY, leading=16, spaceAfter=8)
BIG  = ParagraphStyle('BIG',  fontName='Helvetica', fontSize=12.5, textColor=AZUL,
                      alignment=TA_LEFT, leading=18, spaceAfter=10)
COV_T = ParagraphStyle('COVT', fontName='Helvetica-Bold', fontSize=34, textColor=AZUL,
                        alignment=TA_CENTER, leading=40, spaceAfter=14)
COV_S = ParagraphStyle('COVS', fontName='Helvetica', fontSize=16, textColor=CEL,
                        alignment=TA_CENTER, leading=22, spaceAfter=8)
SMALL = ParagraphStyle('SML', fontName='Helvetica', fontSize=9, textColor=GRIS,
                        alignment=TA_CENTER, leading=12)
CALLOUT_S = ParagraphStyle('CAL', fontName='Helvetica', fontSize=11, textColor=AZUL, leading=16)
CELL   = ParagraphStyle('CELL', fontName='Helvetica',      fontSize=10, textColor=GRIS,
                         alignment=TA_LEFT, leading=13)
CELL_H = ParagraphStyle('CELLH', fontName='Helvetica-Bold', fontSize=10, textColor=colors.white,
                         alignment=TA_CENTER, leading=13)

# ---------- HELPERS ----------
def footer(canvas, doc):
    d = doc.altive_meta
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GRIS)
    canvas.drawString(2*cm, 1.2*cm, f"{d['clientName']} · Diagnóstico SEO")
    canvas.drawRightString(A4[0]-2*cm, 1.2*cm, f"Página {doc.page}")
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
        ('BACKGROUND',   (0,0), (-1,0),  header_bg),
        ('TEXTCOLOR',    (0,0), (-1,0),  colors.white),
        ('FONTNAME',     (0,0), (-1,0),  'Helvetica-Bold'),
        ('FONTNAME',     (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (0,1), (-1,-1), GRIS),
        ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN',        (0,0), (-1,0),  'CENTER'),
        ('GRID',         (0,0), (-1,-1), 0.4, BORDE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [colors.white, FONDO]),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING',   (0,0), (-1,-1), 7),
        ('BOTTOMPADDING',(0,0), (-1,-1), 7),
    ]))
    return t

def caja(texto, color=CEL, bg=FONDO):
    t = Table([[Paragraph(texto, CALLOUT_S)]], colWidths=[16.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',  (0,0), (-1,-1), bg),
        ('LINEBEFORE',  (0,0), (0,-1),  4, color),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING',(0,0), (-1,-1), 14),
        ('TOPPADDING',  (0,0), (-1,-1), 10),
        ('BOTTOMPADDING',(0,0),(-1,-1), 10),
    ]))
    return t

def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(i, BODY), leftIndent=12) for i in items],
        bulletType='bullet', leftIndent=14
    )

# ---------- CONSTRUCTOR ----------
def build(d, output_path):
    m  = d['meta']
    c  = d['client']

    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=1.8*cm, bottomMargin=2*cm)
    doc.altive_meta = m
    s = []

    # ---- PORTADA ----
    s.append(Spacer(1, 4*cm))
    s.append(Paragraph(c['cover']['title'], COV_T))
    s.append(Paragraph(c['cover']['subtitle'], COV_S))
    s.append(Spacer(1, 1.5*cm))
    s.append(Paragraph("Preparado para", COV_S))
    s.append(Paragraph(f"<b>{m['clientName']}</b>", COV_T))
    s.append(Spacer(1, 2*cm))
    s.append(Paragraph(c['cover']['tagline'], COV_S))
    s.append(Paragraph(m['date'], COV_S))
    s.append(PageBreak())

    # ---- INTRO ----
    s.append(Paragraph(c['intro']['title'], H1))
    for p in c['intro']['paragraphs']:
        s.append(Paragraph(p, BODY))
    s.append(Spacer(1, 10))
    s.append(caja(c['intro']['callout'], VERDE))
    s.append(PageBreak())

    # ---- SEO FÁCIL ----
    s.append(Paragraph(c['seoSection']['title'], H1))
    for p in c['seoSection']['paragraphs']:
        s.append(Paragraph(p, BODY))
    s.append(bullets(c['seoSection']['benefits']))
    s.append(PageBreak())

    # ---- DIAGNÓSTICO HOY ----
    s.append(Paragraph(c['diagnosis']['title'], H1))
    s.append(Paragraph(c['diagnosis']['intro'], BODY))

    s.append(Spacer(1, 6))
    s.append(Paragraph(c['diagnosis']['goodTitle'], H2))
    s.append(bullets(c['diagnosis']['good']))

    s.append(Spacer(1, 6))
    s.append(Paragraph(c['diagnosis']['missingTitle'], H2))
    s.append(bullets(c['diagnosis']['missing']))

    s.append(Spacer(1, 10))
    s.append(caja(c['diagnosis']['callout'], NAR))
    s.append(PageBreak())

    # ---- COMPETENCIA ----
    s.append(Paragraph(c['competitors']['title'], H1))
    s.append(Paragraph(c['competitors']['intro'], BODY))
    comp_data = [["Competidor", "Qué lo hace fuerte"]] + \
                [[r['name'], r['strength']] for r in c['competitors']['rows']]
    widths = c['competitors'].get('colWidths', [5.5*cm, 10.5*cm])
    s.append(tabla(comp_data, widths))
    s.append(Spacer(1, 10))
    s.append(caja(c['competitors']['callout'], VERDE))
    s.append(PageBreak())

    # ---- OPORTUNIDADES ----
    s.append(Paragraph(c['opportunities']['title'], H1))
    s.append(Paragraph(c['opportunities']['intro'], BODY))
    op_data = [["#", "Oportunidad", "Por qué importa"]] + \
              [[str(i+1), o['title'], o['why']] for i, o in enumerate(c['opportunities']['items'])]
    s.append(tabla(op_data, [0.9*cm, 5.5*cm, 9.6*cm]))
    s.append(PageBreak())

    # ---- PLAN ----
    s.append(Paragraph(c['plan']['title'], H1))
    s.append(Paragraph(c['plan']['intro'], BODY))
    plan_data = [["Mes", "Qué hacemos", "Qué ganas tú"]] + \
                [[r['month'], r['work'], r['gain']] for r in c['plan']['rows']]
    s.append(tabla(plan_data, [1.2*cm, 7.5*cm, 7.3*cm]))
    s.append(PageBreak())

    # ---- RESULTADOS ----
    s.append(Paragraph(c['results']['title'], H1))
    s.append(Paragraph(c['results']['intro'], BODY))
    res_data = [["Indicador", "Hoy (estimado)", "En 3 meses", "En 6 meses"]] + \
               [[r['kpi'], r['now'], r['m3'], r['m6']] for r in c['results']['rows']]
    s.append(tabla(res_data, [6*cm, 3.2*cm, 3.2*cm, 3.4*cm]))
    s.append(Spacer(1, 10))
    s.append(caja(c['results']['callout'], CEL))
    s.append(PageBreak())

    # ---- QUÉ NECESITAMOS ----
    s.append(Paragraph(c['needs']['title'], H1))
    s.append(bullets(c['needs']['items']))

    s.append(Spacer(1, 14))
    s.append(Paragraph(c['closing']['title'], H1))
    for p in c['closing']['paragraphs']:
        s.append(Paragraph(p, BIG))
    s.append(Spacer(1, 10))
    s.append(caja(c['closing']['callout'], VERDE))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_auditoria_cliente.py <data.json> <output.pdf>")
        sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f:
        data = json.load(f)
    build(data, sys.argv[2])
