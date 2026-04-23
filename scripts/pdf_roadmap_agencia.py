"""
ALTIVE TOOLS — PDF Roadmap Integrado AGENCIA
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
VERDE_F = colors.HexColor("#E8F8F5")
NAR_F   = colors.HexColor("#FEF3E2")
ROJO_F  = colors.HexColor("#FDECEC")

MES_COLORS = [CEL, VERDE, NAR]
MES_FONDES = [FONDO, VERDE_F, NAR_F]

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
WEEK_H=ParagraphStyle('WKH', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white,
                       alignment=TA_CENTER, leading=11)
ACTION=ParagraphStyle('ACT', fontName='Helvetica', fontSize=8.5, textColor=GRIS,
                       leading=11, spaceAfter=2)
OWNER =ParagraphStyle('OWN', fontName='Helvetica-Bold', fontSize=8, textColor=CEL,
                       leading=10)

def footer(canvas, doc):
    m = doc.altive_meta
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GRIS)
    canvas.drawString(2*cm, 1.2*cm,
        f"Roadmap Integrado · {m['clientName']} · Documento interno / Agencia")
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

def owner_color(owner):
    o = str(owner).lower()
    if 'agencia' in o: return CEL
    if 'cliente' in o: return NAR
    return VERDE

def render_month(month_data, index):
    """Renders one month block with 4 weeks."""
    els = []
    mes_color = MES_COLORS[index % 3]
    mes_fondo = MES_FONDES[index % 3]

    month_name = month_data.get('month', f'Mes {index+1}')
    theme = month_data.get('theme', '')
    focus = month_data.get('focus', '')

    # Month header
    hdr = Table([[
        Paragraph(f"<b>{month_name} — {theme}</b>", CELL_H),
        Paragraph(focus, CELL),
    ]], colWidths=[5*cm, 12*cm])
    hdr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), mes_color),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    els.append(hdr)

    # Weeks
    weeks = month_data.get('weeks', [])
    for week in weeks:
        week_name = week.get('week', '')
        actions   = week.get('actions', [])

        # Build actions cell
        action_items = []
        for act in actions:
            action = act.get('action', '')
            owner  = act.get('owner', 'Agencia')
            o_color = owner_color(owner)
            action_items.append(Paragraph(f"▸ {action}", ACTION))
            action_items.append(Paragraph(f"   {owner}", OWNER))
            action_items.append(Spacer(1, 2))

        week_t = Table([[
            Paragraph(week_name, WEEK_H),
            action_items if action_items else [Paragraph("—", CELL)],
        ]], colWidths=[3*cm, 14*cm])
        week_t.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (0,-1), mes_color),
            ('BACKGROUND',    (1,0), (1,-1), mes_fondo),
            ('LEFTPADDING',   (0,0), (-1,-1), 6),
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('VALIGN',        (0,0), (-1,-1), 'TOP'),
            ('LINEBELOW',     (0,0), (-1,-1), 0.3, BORDE),
        ]))
        els.append(week_t)

    # Milestone + KPI
    milestone = month_data.get('milestone', '')
    kpi       = month_data.get('kpi', '')
    if milestone or kpi:
        mk_data = []
        if milestone:
            mk_data.append(["🏁 Hito del mes", milestone])
        if kpi:
            mk_data.append(["📊 KPI", kpi])
        mk_t = tabla(mk_data, [3.5*cm, 13*cm], header_bg=mes_color) if not mk_data else \
               Table([[Paragraph(r[0], CELL_H), Paragraph(r[1], CELL)] for r in mk_data],
                     colWidths=[3.5*cm, 13*cm])
        mk_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), mes_color),
            ('BACKGROUND', (1,0), (1,-1), FONDO),
            ('GRID', (0,0), (-1,-1), 0.4, BORDE),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        els.append(mk_t)

    els.append(Spacer(1, 10))
    return els

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
    s.append(Paragraph("ROADMAP ESTRATÉGICO INTEGRADO", COV_T))
    s.append(Paragraph(m['clientName'], COV_S))
    s.append(Spacer(1, 0.6*cm))
    s.append(Paragraph(f"Plan de 3 meses · {m.get('city','')} · SEO + Meta Ads + Google Ads", COV_S))
    s.append(Spacer(1, 1.2*cm))
    s.append(Paragraph("Documento técnico · Uso interno / Agencia", COV_S))
    s.append(Spacer(1, 3*cm))
    s.append(Paragraph(f"Preparado por el equipo de estrategia · {m['date']}", SMALL))
    s.append(PageBreak())

    # ── 1. RESUMEN EJECUTIVO ───────────────────────────────────────────────
    s.append(Paragraph("1. Resumen Ejecutivo", H1))
    es = a.get('executiveSummary', {})
    if es.get('vision'):
        s.append(callout(f"<b>Visión del trimestre:</b> {es['vision']}", CEL))
        s.append(Spacer(1, 8))
    if es.get('priorities'):
        s.append(Paragraph("Prioridades estratégicas del período:", H3))
        for i, p in enumerate(es['priorities'], 1):
            s.append(Paragraph(f"<b>{i}.</b> {p}", BODY))
    if es.get('logic'):
        s.append(Spacer(1, 8))
        s.append(callout(f"<b>Lógica del plan:</b> {es['logic']}", VERDE))

    s.append(Spacer(1, 10))
    sp = a.get('startingPoint', {})
    s.append(Paragraph("1.1 Estado de partida", H3))
    if sp.get('strengths'):
        s.append(Paragraph("Fortalezas actuales (no tocar):", H3))
        s.append(bullets(sp['strengths']))
    if sp.get('criticalGaps'):
        s.append(Paragraph("Brechas críticas a resolver:", H3))
        s.append(bullets(sp['criticalGaps']))
    if sp.get('urgentNeeds'):
        s.append(Paragraph("Condiciones previas a la pauta activa:", H3))
        s.append(bullets(sp['urgentNeeds']))
    s.append(PageBreak())

    # ── 2. ROADMAP MENSUAL ─────────────────────────────────────────────────
    s.append(Paragraph("2. Roadmap Mensual — 3 Meses", H1))
    months = a.get('months', [])
    for idx, month in enumerate(months):
        s.extend(render_month(month, idx))
        if idx < len(months) - 1:
            s.append(PageBreak())
    s.append(PageBreak())

    # ── 3. TABLA DE INICIATIVAS ────────────────────────────────────────────
    s.append(Paragraph("3. Tabla de Iniciativas Priorizadas", H1))
    initiatives = a.get('initiativesTable', [])
    if initiatives:
        init_data = [["Iniciativa", "Módulo", "Responsable", "Inicio", "Impacto", "Esfuerzo"]] + \
                    [[i.get('name',''), i.get('module',''), i.get('owner',''),
                      i.get('startWeek',''), i.get('impact',''), i.get('effort','')] for i in initiatives]
        s.append(tabla(init_data, [5.5*cm, 2.2*cm, 2.2*cm, 1.5*cm, 2*cm, 2*cm]))
        s.append(Spacer(1, 8))
        # Criterios de éxito separados (más espacio)
        s.append(Paragraph("Criterios de éxito por iniciativa:", H3))
        crit_data = [["Iniciativa", "Dependencia", "Criterio de éxito"]] + \
                    [[i.get('name',''), i.get('dependency',''), i.get('successCriteria','')] for i in initiatives]
        s.append(tabla(crit_data, [5.5*cm, 4*cm, 7*cm]))
    s.append(PageBreak())

    # ── 4. QUICK WINS ─────────────────────────────────────────────────────
    s.append(Paragraph("4. Quick Wins (primeras 2 semanas)", H1))
    qws = a.get('quickWins', [])
    if qws:
        qw_data = [["Acción", "Por qué ahora", "Responsable", "Cómo se mide"]] + \
                  [[q.get('action',''), q.get('why',''), q.get('owner',''), q.get('metric','')] for q in qws]
        s.append(tabla(qw_data, [5.5*cm, 4*cm, 2.5*cm, 4.5*cm]))
    s.append(PageBreak())

    # ── 5. INVERSIÓN ──────────────────────────────────────────────────────
    s.append(Paragraph("5. Distribución de Inversión Publicitaria", H1))
    budget = a.get('budgetAllocation', [])
    if budget:
        bud_data = [["Período", "Meta Ads", "Google Ads", "Total", "Lógica"]] + \
                   [[b.get('period',''), b.get('metaAds',''), b.get('googleAds',''),
                     b.get('total',''), b.get('logic','')] for b in budget]
        s.append(tabla(bud_data, [2*cm, 3*cm, 3*cm, 2.5*cm, 6*cm]))
    s.append(PageBreak())

    # ── 6. RIESGOS ─────────────────────────────────────────────────────────
    s.append(Paragraph("6. Riesgos y Contingencias", H1))
    risks = a.get('risks', [])
    if risks:
        risk_data = [["Riesgo", "Señal de alerta", "Contingencia"]] + \
                    [[r.get('risk',''), r.get('alert',''), r.get('contingency','')] for r in risks]
        s.append(tabla(risk_data, [4.5*cm, 5.5*cm, 6.5*cm]))
    s.append(PageBreak())

    # ── 7. COMPROMISOS DEL CLIENTE ─────────────────────────────────────────
    s.append(Paragraph("7. Compromisos del Cliente", H1))
    s.append(bullets(a.get('clientCommitments', [])))
    s.append(Spacer(1, 12))

    # ── 8. MÉTRICAS DE SEGUIMIENTO ─────────────────────────────────────────
    s.append(Paragraph("8. Métricas de Seguimiento del Trimestre", H1))
    tracking = a.get('trackingMetrics', [])
    if tracking:
        track_data = [["KPI", "Frecuencia", "Baseline", "Meta Trimestre"]] + \
                     [[t.get('kpi',''), t.get('frequency',''), t.get('baseline',''), t.get('target','')] for t in tracking]
        s.append(tabla(track_data, [6*cm, 2.5*cm, 3.5*cm, 4.5*cm]))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_roadmap_agencia.py <data.json> <output.pdf>")
        sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f:
        data = json.load(f)
    build(data, sys.argv[2])
