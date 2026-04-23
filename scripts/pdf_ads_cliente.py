"""
ALTIVE TOOLS — PDF Google Ads CLIENTE (lenguaje simple)
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
GRIS  = colors.HexColor("#3D3D3D"); VERDE = colors.HexColor("#1E8449")
NAR   = colors.HexColor("#E67E22"); FONDO = colors.HexColor("#EEF5FB")
BORDE = colors.HexColor("#CFD8E3")

H1  = ParagraphStyle('H1',fontName='Helvetica-Bold',fontSize=22,textColor=AZUL,spaceAfter=14,spaceBefore=8,leading=26)
H2  = ParagraphStyle('H2',fontName='Helvetica-Bold',fontSize=16,textColor=CEL, spaceAfter=8,spaceBefore=14,leading=20)
H3  = ParagraphStyle('H3',fontName='Helvetica-Bold',fontSize=13,textColor=AZUL,spaceAfter=6,spaceBefore=10,leading=16)
BODY= ParagraphStyle('BODY',fontName='Helvetica',fontSize=11,textColor=GRIS,alignment=TA_JUSTIFY,leading=16,spaceAfter=8)
BIG = ParagraphStyle('BIG',fontName='Helvetica',fontSize=12.5,textColor=AZUL,alignment=TA_LEFT,leading=18,spaceAfter=10)
COV_T=ParagraphStyle('COVT',fontName='Helvetica-Bold',fontSize=34,textColor=AZUL,alignment=TA_CENTER,leading=40,spaceAfter=14)
COV_S=ParagraphStyle('COVS',fontName='Helvetica',fontSize=16,textColor=CEL,alignment=TA_CENTER,leading=22,spaceAfter=8)
CAL_S=ParagraphStyle('CAL',fontName='Helvetica',fontSize=11,textColor=AZUL,leading=16)
CELL =ParagraphStyle('CELL',fontName='Helvetica',fontSize=10,textColor=GRIS,alignment=TA_LEFT,leading=13)
CELL_H=ParagraphStyle('CELLH',fontName='Helvetica-Bold',fontSize=10,textColor=colors.white,alignment=TA_CENTER,leading=13)

def footer(canvas, doc):
    m = doc.altive_meta; canvas.saveState(); canvas.setFont('Helvetica',8); canvas.setFillColor(GRIS)
    canvas.drawString(2*cm,1.2*cm,f"{m['clientName']} · Plan de Publicidad Digital")
    canvas.drawRightString(A4[0]-2*cm,1.2*cm,f"Página {doc.page}")
    canvas.setStrokeColor(BORDE); canvas.line(2*cm,1.5*cm,A4[0]-2*cm,1.5*cm); canvas.restoreState()

def _wrap(data):
    out=[]
    for ri,row in enumerate(data):
        out.append([Paragraph(str(c),CELL_H if ri==0 else CELL) if not hasattr(c,'wrap') else c for c in row])
    return out

def tabla(data,col_widths,header_bg=AZUL):
    t=Table(_wrap(data),colWidths=col_widths,repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),header_bg),('TEXTCOLOR',(0,0),(-1,0),colors.white),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTNAME',(0,1),(-1,-1),'Helvetica'),
        ('TEXTCOLOR',(0,1),(-1,-1),GRIS),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('ALIGN',(0,0),(-1,0),'CENTER'),('GRID',(0,0),(-1,-1),0.4,BORDE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,FONDO]),
        ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
        ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
    ]))
    return t

def caja(texto,color=CEL,bg=FONDO):
    t=Table([[Paragraph(texto,CAL_S)]],colWidths=[16.5*cm])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),bg),('LINEBEFORE',(0,0),(0,-1),4,color),
        ('LEFTPADDING',(0,0),(-1,-1),14),('RIGHTPADDING',(0,0),(-1,-1),14),
        ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    return t

def bullets(items):
    return ListFlowable([ListItem(Paragraph(i,BODY),leftIndent=12) for i in items],
                        bulletType='bullet',leftIndent=14)

def build(d, output_path):
    m = d['meta']; c = d['client']
    doc = SimpleDocTemplate(output_path,pagesize=A4,
                            leftMargin=2*cm,rightMargin=2*cm,topMargin=1.8*cm,bottomMargin=2*cm)
    doc.altive_meta = m; s = []
    budget = f"${m['monthlyBudgetCOP']:,} COP/mes".replace(',','.') if m.get('monthlyBudgetCOP') else "A definir"

    # PORTADA
    s += [Spacer(1,4*cm), Paragraph(c['cover']['title'],COV_T),
          Paragraph(c['cover']['subtitle'],COV_S), Spacer(1,1.5*cm),
          Paragraph("Preparado para",COV_S), Paragraph(f"<b>{m['clientName']}</b>",COV_T),
          Spacer(1,1.5*cm), Paragraph(f"{m['city']} · {budget}",COV_S),
          Paragraph(f"Preparado por Altive · {m['date']}",COV_S), PageBreak()]

    # LA IDEA
    s.append(Paragraph("La idea en pocas palabras", H1))
    s.append(caja(c['theIdea'],CEL)); s.append(Spacer(1,10))

    # DÓNDE APARECES
    s.append(Paragraph("¿Dónde vas a aparecer?", H1))
    s.append(Paragraph(f"Cuando alguien en {m['city']} busca algo relacionado con tu negocio, tus anuncios van a aparecer en estos lugares:", BODY))
    where_data = [["¿Dónde?","¿Qué ve la persona?"]] + [[w['location'],w['userSees']] for w in c['whereYouAppear']]
    s.append(tabla(where_data,[5*cm,11.5*cm])); s.append(PageBreak())

    # LAS 3 CAMPAÑAS
    s.append(Paragraph("Las 3 campañas que vamos a activar", H1))
    s.append(Paragraph("Tu estrategia se divide en 3 campañas, cada una con un objetivo claro:", BODY))
    CAMP_COLORS = [CEL, VERDE, AZUL]
    for i, camp in enumerate(c['campaignsExplained']):
        t = Table([[Paragraph(f"<b>{i+1}. {camp['name']}</b>", CAL_S)],
                   [Paragraph(camp['explanation'], BODY)]],
                  colWidths=[16.5*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1),FONDO),
            ('LINEBEFORE',(0,0),(0,-1),4,CAMP_COLORS[i % len(CAMP_COLORS)]),
            ('LEFTPADDING',(0,0),(-1,-1),14),('RIGHTPADDING',(0,0),(-1,-1),14),
            ('TOPPADDING',(0,0),(-1,0),10),('BOTTOMPADDING',(0,-1),(-1,-1),10),
        ]))
        s.append(t); s.append(Spacer(1,8))
    s.append(PageBreak())

    # RESULTADOS
    s.append(Paragraph("¿Qué resultados podemos esperar?", H1))
    s.append(Paragraph(f"Estos son los estimados según el presupuesto invertido en {m['city']}:", BODY))
    res_data = [["Escenario","Inversión/mes","Visitas/mes","Visitas/día","Costo/visita"]] + \
               [[r['scenario'],r['investment'],r['monthlyVisits'],r['dailyVisits'],r['costPerVisit']] for r in c['expectedResults']]
    s.append(tabla(res_data,[3*cm,3.5*cm,3*cm,3*cm,3.5*cm]))
    s.append(Spacer(1,10))
    s.append(caja("<b>Nota:</b> el objetivo de esta campaña es maximizar el tráfico hacia tu sitio web. "
                  "Cada visita es una persona que conoce tu negocio y puede volver.", NAR))

    # QUÉ NECESITAMOS
    s.append(Paragraph("Lo que necesitamos de tu parte", H1))
    s.append(bullets(c['whatWeNeedFromYou'])); s.append(PageBreak())

    # NUESTRO COMPROMISO
    s.append(Paragraph("Nuestro compromiso contigo", H1))
    for p in c['ourPromise']:
        row = Table([[Paragraph("✓",ParagraphStyle('CHK',fontName='Helvetica-Bold',fontSize=14,textColor=VERDE,leading=18)),
                      Paragraph(p,BIG)]], colWidths=[0.8*cm,16*cm])
        row.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),
                                  ('TOPPADDING',(0,0),(-1,-1),3)]))
        s.append(row); s.append(Spacer(1,6))

    s.append(Spacer(1,14))
    s.append(caja(c['closing'], VERDE))
    s.append(Spacer(1,16))
    s.append(Paragraph("Altive · Tu agencia de marketing digital", ParagraphStyle('END',fontName='Helvetica',
             fontSize=11,textColor=CEL,alignment=TA_CENTER,leading=14)))

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {output_path}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python pdf_ads_cliente.py <data.json> <output.pdf>"); sys.exit(1)
    with open(sys.argv[1], encoding='utf-8') as f: data = json.load(f)
    build(data, sys.argv[2])
