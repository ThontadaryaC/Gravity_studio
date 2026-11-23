# generate_clients_pdf.py
# Generates executive landscape PDF containing verified 1-month client login ledger
import json
import os
import time
import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf(audit_file='data/login_audit.json', pdf_output='clients_data.pdf'):
    now = datetime.datetime.now()
    current_year = now.year
    current_month = now.month
    month_name = now.strftime('%B %Y')

    logs = []
    if os.path.exists(audit_file):
        with open(audit_file, 'r', encoding='utf-8') as f:
            try:
                raw_logs = json.load(f)
                active_logs = []
                for e in raw_logs:
                    epoch = e.get('epoch', 0)
                    if epoch:
                        dt = datetime.datetime.fromtimestamp(epoch / 1000.0)
                    else:
                        dt = now
                    # Retain only current calendar month records
                    if dt.year == current_year and dt.month == current_month:
                        active_logs.append(e)

                # Filter: Except admins, check and record all client logins
                logs = [
                    e for e in active_logs
                    if (e.get('role', '').lower() not in ('admin', 'founder', 'ceo', 'cto'))
                    and not any(e.get('email', '').lower().startswith(p) for p in ('admin@', 'founder@', 'ceo@', 'cto@'))
                ]
            except Exception as e:
                print('Error loading audit json:', e)

    doc = SimpleDocTemplate(
        pdf_output,
        pagesize=landscape(letter),
        rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a')
    )
    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#64748b')
    )
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )
    header_cell_style = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#ffffff')
    )

    story = []
    story.append(Paragraph('ANTIGRAVITY STUDIOS &bull; MONTHLY CLIENT LOGIN MONITOR LEDGER', title_style))
    story.append(Spacer(1, 4))
    
    current_time_str = now.strftime('%d %b %Y, %I:%M %p IST')
    story.append(Paragraph(f'Active Month: {month_name} &bull; 1-Month Retention (Auto-resets on the 1st of each month) &bull; Generated: {current_time_str}', sub_style))
    story.append(Spacer(1, 14))

    table_data = [[
        Paragraph('Timestamp (IST)', header_cell_style),
        Paragraph('Client Name', header_cell_style),
        Paragraph('Work Email', header_cell_style),
        Paragraph('WhatsApp / Contact', header_cell_style),
        Paragraph('Auth Method', header_cell_style),
        Paragraph('Device / Platform', header_cell_style),
        Paragraph('Status', header_cell_style)
    ]]

    if not logs:
        table_data.append([
            Paragraph(f'No client logins recorded for {month_name} yet', cell_style),
            Paragraph('-', cell_style),
            Paragraph('-', cell_style),
            Paragraph('-', cell_style),
            Paragraph('-', cell_style),
            Paragraph('-', cell_style),
            Paragraph('-', cell_style)
        ])
    else:
        for entry in logs:
            phone_val = entry.get('phone') or 'Not Provided'
            auth_val = entry.get('authMethod', 'Email & Password')
            table_data.append([
                Paragraph(entry.get('timestampIst', 'N/A'), cell_style),
                Paragraph(entry.get('name', 'N/A'), cell_style),
                Paragraph(entry.get('email', 'N/A'), cell_style),
                Paragraph(phone_val, cell_style),
                Paragraph(auth_val, cell_style),
                Paragraph(entry.get('device', 'Desktop'), cell_style),
                Paragraph(entry.get('status', 'SUCCESS'), cell_style)
            ])

    t = Table(table_data, colWidths=[110, 100, 170, 110, 100, 100, 60])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 16))
    story.append(Paragraph('Notice: All client login records are retained for 1 full calendar month. On the 1st date of every month, previous records automatically purge from the active dashboard to start fresh. Download this PDF to archive monthly records. &bull; Antigravity Studios Client Security Protocol', sub_style))

    doc.build(story)
    print(f'Successfully generated {pdf_output} ({os.path.getsize(pdf_output)} bytes)')

if __name__ == '__main__':
    generate_pdf()
