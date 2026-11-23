import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 785, "VISMO DIGITAL SOLUTION — WHATSAPP CLOUD API & ORDER WORKFLOW ARCHITECTURE")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 777, 54 + 487, 777)
        
        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 30, "Confidential — Prepared for Vismo E-Commerce Operations")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(54 + 487, 30, page_text)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 42, 54 + 487, 42)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0F172A")    # Deep slate
    c_brand = colors.HexColor("#0284C7")      # Rich blue
    c_dark = colors.HexColor("#1E293B")       # Dark charcoal text
    c_muted = colors.HexColor("#64748B")      # Muted gray text
    c_bg_light = colors.HexColor("#F8FAFC")   # Light background
    c_border = colors.HexColor("#E2E8F0")     # Border color
    c_accent = colors.HexColor("#0D9488")     # Teal accent
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_brand,
        spaceAfter=4
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_muted,
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=c_brand,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=13,
        textColor=c_dark,
        spaceAfter=5
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_dark
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold',
        textColor=c_primary
    )
    table_cell_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )
    code_block = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # Title & Header Block
    story.append(Paragraph("VISMO DIGITAL SOLUTION", subtitle_style))
    story.append(Paragraph("WhatsApp Cloud API Integration, Setup Guide & Fulfillment Architecture", title_style))
    story.append(Paragraph("<b>Project:</b> Vismo E-Commerce Platform | <b>Quotation Ref:</b> PYN-QT-2026-010 | <b>Date:</b> November 2026", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_brand, spaceBefore=0, spaceAfter=10))

    # Section 1: Executive Overview
    story.append(Paragraph("1. Executive Overview & Quotation Scope", h1_style))
    story.append(Paragraph(
        "In your quotation (<b>Item #3: WhatsApp Cloud API Integration @ ₹7,000</b>), the development fee covers the technical setup connecting your store database, authentication system, and checkout triggers directly to Meta's WhatsApp Cloud API. This comprehensive document provides: (1) A complete <b>step-by-step implementation roadmap</b> to acquire, verify, and launch WhatsApp Cloud API & OTPs; (2) The <b>two-stage dispatch mechanism (Packing Staff first ➔ Delivery Boy second)</b>; (3) The <b>automated PDF invoice generator</b>; and (4) Detailed <b>per-message cost analysis</b> versus traditional SMS.",
        body_style
    ))

    # Section 2: Step-by-Step Setup Guide
    story.append(Paragraph("2. Step-by-Step Guide: How to Get WhatsApp Cloud API & OTP Setup", h1_style))
    story.append(Paragraph(
        "Follow these exact 7 steps to get your official Meta WhatsApp Business API operational for Login OTPs and Order Notifications:",
        body_style
    ))

    steps_data = [
        [
            Paragraph("<b>Step #</b>", table_cell_header),
            Paragraph("<b>Phase / Action</b>", table_cell_header),
            Paragraph("<b>Exact Instructions & Requirements</b>", table_cell_header),
            Paragraph("<b>Owner</b>", table_cell_header)
        ],
        [
            Paragraph("<b>Step 1</b>", table_cell_bold),
            Paragraph("<b>Meta Developer Account & App Creation</b>", table_cell_bold),
            Paragraph("• Go to <code>developers.facebook.com</code> and log in with your primary Facebook account.<br/>• Click <b>My Apps ➔ Create App</b>.<br/>• Select <b>Other ➔ Business</b> as the app type.<br/>• Name the app <b>'Vismo Commerce'</b> and link your official Meta Business Account.<br/>• Under Add Products, select <b>WhatsApp</b> and click <b>Set up</b>.", table_cell),
            Paragraph("Vismo / Developer", table_cell)
        ],
        [
            Paragraph("<b>Step 2</b>", table_cell_bold),
            Paragraph("<b>Dedicated Phone Number Setup</b>", table_cell_bold),
            Paragraph("• <b>CRITICAL:</b> You need a phone number that is <b>NOT registered on regular WhatsApp or WhatsApp Business mobile app</b>.<br/>• If the number is currently on WhatsApp mobile, go to <i>Settings ➔ Account ➔ Delete Account</i> on that phone first.<br/>• In the Meta Developer Portal under WhatsApp ➔ API Setup, click <b>Add Phone Number</b>, enter your business phone number, and verify it via SMS/Voice call.", table_cell),
            Paragraph("Vismo Owner", table_cell)
        ],
        [
            Paragraph("<b>Step 3</b>", table_cell_bold),
            Paragraph("<b>Meta Business Verification</b>", table_cell_bold),
            Paragraph("• Go to <code>business.facebook.com/settings/info</code>.<br/>• Upload legal business documents to verify Vismo (GST Certificate, Incorporation Certificate, MSME, or Business Bank Statement).<br/>• Verification unlocks your messaging tier from 250 conversations/day up to <b>1,000, 10,000, or unlimited messages per day</b>.", table_cell),
            Paragraph("Vismo Owner", table_cell)
        ],
        [
            Paragraph("<b>Step 4</b>", table_cell_bold),
            Paragraph("<b>Payment Method for Billing</b>", table_cell_bold),
            Paragraph("• Go to Meta Business Settings ➔ <b>Payment Methods</b>.<br/>• Add a Credit Card or international Debit Card with online international transactions enabled.<br/>• Meta bills this card directly once a month for delivered messages at the exact raw rate (<b>~₹0.14 per OTP/utility</b>).", table_cell),
            Paragraph("Vismo Owner", table_cell)
        ],
        [
            Paragraph("<b>Step 5</b>", table_cell_bold),
            Paragraph("<b>Create & Submit Message Templates</b>", table_cell_bold),
            Paragraph("• In WhatsApp Manager ➔ Message Templates, create two core templates:<br/>  <b>1. OTP Template:</b> Category = <i>AUTHENTICATION</i>, add 'Copy Code' one-tap button.<br/>  <b>2. Invoice Template:</b> Category = <i>UTILITY</i>, Header = <i>Document (PDF)</i>, Body = Order details, Button = Track Order.<br/>• Meta auto-approves Authentication OTP templates within 1-2 minutes.", table_cell),
            Paragraph("Developer (PYN Tech)", table_cell)
        ],
        [
            Paragraph("<b>Step 6</b>", table_cell_bold),
            Paragraph("<b>System User & Permanent Access Token</b>", table_cell_bold),
            Paragraph("• In Meta Business Settings ➔ <b>System Users</b>, create an Admin System User.<br/>• Assign assets (your WhatsApp Business Account) and grant permissions: <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code>.<br/>• Generate a <b>Never-Expiring Permanent Access Token</b>.<br/>• Give the Developer: <b>Phone Number ID</b>, <b>WABA ID</b>, and the <b>Access Token</b>.", table_cell),
            Paragraph("Vismo / Developer", table_cell)
        ],
        [
            Paragraph("<b>Step 7</b>", table_cell_bold),
            Paragraph("<b>Backend API Integration & Webhooks</b>", table_cell_bold),
            Paragraph("• The developer integrates the API into Vismo's backend (Node.js/Python):<br/>  - <b>When user clicks Login:</b> Server generates 6-digit code, calls Meta Graph API to send OTP.<br/>  - <b>When user inputs code:</b> Backend verifies and creates session.<br/>  - <b>Webhooks configured:</b> To track message delivery, read status, and user replies.", table_cell),
            Paragraph("Developer (PYN Tech)", table_cell)
        ]
    ]

    t_steps = Table(steps_data, colWidths=[45, 105, 275, 62])
    t_steps.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_steps)
    story.append(Spacer(1, 10))

    # Page Break for clean reading
    story.append(PageBreak())

    # Section 3: Order Routing Workflow
    story.append(Paragraph("3. Operational Order Routing: Packing Staff First Protocol", h1_style))
    story.append(Paragraph(
        "A critical problem in e-commerce logistics occurs when delivery agents are notified immediately at order placement. If a courier arrives before items are picked and boxed, riders cancel, store staff faces panic, and re-dispatch fees accumulate. Vismo enforces a <b>Two-Stage Dispatch Guard</b>:",
        body_style
    ))

    flow_data = [
        [
            Paragraph("<b>Stage</b>", table_cell_header),
            Paragraph("<b>Recipient</b>", table_cell_header),
            Paragraph("<b>Action & Trigger Logic</b>", table_cell_header),
            Paragraph("<b>Channel / Notification</b>", table_cell_header)
        ],
        [
            Paragraph("<b>1. Placement</b>", table_cell_bold),
            Paragraph("Customer", table_cell),
            Paragraph("Order placed & payment verified. Customer receives instant confirmation with Tax Invoice PDF attached.", table_cell),
            Paragraph("WhatsApp Utility (Document)", table_cell)
        ],
        [
            Paragraph("<b>2. Packing (Priority)</b>", table_cell_bold),
            Paragraph("Warehouse / Store Packing Person", table_cell),
            Paragraph("<b>ONLY the packing staff is alerted</b>. They receive Item Checklist, SKUs, and quantities. <i>Delivery boy is NOT assigned yet.</i>", table_cell),
            Paragraph("Store WhatsApp Bot / Packer App", table_cell)
        ],
        [
            Paragraph("<b>3. Verification</b>", table_cell_bold),
            Paragraph("Packing Person", table_cell),
            Paragraph("Packer verifies stock, boxes items, seals parcel, attaches label, and taps <b>[Mark as Packed & Ready for Pickup]</b>.", table_cell),
            Paragraph("Admin Warehouse Portal / Action Button", table_cell)
        ],
        [
            Paragraph("<b>4. Courier Dispatch</b>", table_cell_bold),
            Paragraph("Delivery Agent / Rider", table_cell),
            Paragraph("System automatically triggers courier assignment. Delivery boy receives pickup location, sealed parcel ID, and customer drop-off area.", table_cell),
            Paragraph("Rider App Push / WhatsApp Rider Alert", table_cell)
        ],
        [
            Paragraph("<b>5. Fulfillment</b>", table_cell_bold),
            Paragraph("Customer & Rider", table_cell),
            Paragraph("Rider confirms pickup ➔ Customer receives 'Out for Delivery' update with live tracking link and Delivery OTP. Order completed upon OTP entry.", table_cell),
            Paragraph("WhatsApp Utility Alert + Secure OTP", table_cell)
        ]
    ]
    t_flow = Table(flow_data, colWidths=[65, 90, 225, 107])
    t_flow.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_flow)
    story.append(Spacer(1, 8))

    # Section 4: PDF Invoice Delivery Mechanism
    story.append(Paragraph("4. PDF Invoice Generation & WhatsApp Delivery ('Give PDF Each')", h1_style))
    story.append(Paragraph(
        "To fulfill the requirement of sending an official PDF invoice for each order directly inside WhatsApp, the system executes an automated 3-step pipeline:",
        body_style
    ))
    
    pdf_steps = [
        "<b>1. Dynamic PDF Rendering:</b> On checkout webhook trigger, the server renders a compliant GST Tax Invoice PDF (incorporating Vismo logo, HSN codes, tax breakdown, customer address, and QR verification code) in under 800ms.",
        "<b>2. Secure Object Storage:</b> The PDF is written to encrypted cloud storage (e.g. AWS S3 / Cloudinary) with a signed, time-authenticated HTTPS URL.",
        "<b>3. Meta Cloud API Document Payload:</b> The backend issues a POST request to Meta's Graph API with message type <code>'document'</code>. Meta renders the file directly inside the customer's WhatsApp conversation window without external browser redirects."
    ]
    for step in pdf_steps:
        story.append(Paragraph(f"• {step}", body_style))
    story.append(Spacer(1, 8))

    # Page Break for clean reading
    story.append(PageBreak())

    # Section 5: Cost Breakdown WhatsApp vs SMS
    story.append(Paragraph("5. Comprehensive Cost Analysis: WhatsApp Cloud API vs Traditional SMS", h1_style))
    story.append(Paragraph(
        "A comparison of per-message and per-order expenses in India shows that WhatsApp provides higher delivery reliability, full PDF document delivery, and lower operational overhead.",
        body_style
    ))

    cost_data = [
        [
            Paragraph("<b>Category</b>", table_cell_header),
            Paragraph("<b>WhatsApp Cloud API (Meta Rates)</b>", table_cell_header),
            Paragraph("<b>Traditional SMS (MSG91 / Fast2SMS)</b>", table_cell_header),
            Paragraph("<b>Advantage / Key Differences</b>", table_cell_header)
        ],
        [
            Paragraph("<b>Authentication (OTP)</b>", table_cell_bold),
            Paragraph("<b>₹0.115</b> + 18% GST = <b>₹0.136</b><br/>(~14 paise per delivered OTP)", table_cell),
            Paragraph("<b>₹0.150 – ₹0.220</b> + GST = <b>~₹0.20</b><br/>+ ₹0.025 DLT scrubbing fee", table_cell),
            Paragraph("WhatsApp includes instant <i>'Copy Code'</i> button; ~30% cheaper; billed on <b>delivered</b> only.", table_cell)
        ],
        [
            Paragraph("<b>Utility (Order Updates & Invoices)</b>", table_cell_bold),
            Paragraph("<b>₹0.115</b> + 18% GST = <b>₹0.136</b><br/>(Full PDF attached at no extra charge)", table_cell),
            Paragraph("<b>₹0.180 – ₹0.250</b> per 160-char SMS<br/>(Cannot attach PDF; short links only)", table_cell),
            Paragraph("Meta charges the same flat 11.5 paise whether sending plain text or a 2MB PDF document.", table_cell)
        ],
        [
            Paragraph("<b>Regulatory Compliance (DLT)</b>", table_cell_bold),
            Paragraph("<b>₹0.00</b> (No DLT registration needed)<br/>Direct Meta Business verification", table_cell),
            Paragraph("<b>₹2,500 – ₹5,000</b> mandatory one-time registration with Jio/Airtel + renewal fees", table_cell),
            Paragraph("WhatsApp avoids rigid TRAI telecom template rejections and DLT scrubbing costs.", table_cell)
        ],
        [
            Paragraph("<b>Customer Support Window</b>", table_cell_bold),
            Paragraph("<b>1,000 Free conversations/mo</b><br/>Two-way chat inside 24-hr session window", table_cell),
            Paragraph("Not supported (SMS is 1-way outbound). Inbound requires costly 2-way shortcodes.", table_cell),
            Paragraph("Users can ask support queries or request returns directly in chat for zero extra cost.", table_cell)
        ]
    ]
    t_cost = Table(cost_data, colWidths=[85, 130, 130, 142])
    t_cost.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_cost)
    story.append(Spacer(1, 8))

    # Lifecycle Simulation Box
    story.append(Paragraph("<b>End-to-End Cost Simulation for 1,000 Orders (INR):</b>", h2_style))
    sim_data = [
        [
            Paragraph("<b>Order Touchpoint</b>", table_cell_header),
            Paragraph("<b>WhatsApp Cost (1,000 Orders)</b>", table_cell_header),
            Paragraph("<b>SMS Cost (1,000 Orders)</b>", table_cell_header)
        ],
        [Paragraph("1. User Signup / Login OTP", table_cell), Paragraph("₹136.00", table_cell), Paragraph("₹200.00", table_cell)],
        [Paragraph("2. Order Confirmed + PDF Invoice Attached", table_cell), Paragraph("₹136.00", table_cell), Paragraph("₹225.00 (Plain link)", table_cell)],
        [Paragraph("3. Packed & Dispatched Notification", table_cell), Paragraph("₹136.00", table_cell), Paragraph("₹200.00", table_cell)],
        [Paragraph("4. Out for Delivery Alert + Delivery PIN", table_cell), Paragraph("₹136.00", table_cell), Paragraph("₹200.00", table_cell)],
        [Paragraph("<b>Total Communication Expense for 1,000 Orders</b>", table_cell_bold), Paragraph("<b>₹544.00</b> (~54 paise / order)", table_cell_bold), Paragraph("<b>₹825.00</b> (~82 paise / order)", table_cell_bold)]
    ]
    t_sim = Table(sim_data, colWidths=[230, 128, 129])
    t_sim.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, c_bg_light]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_sim)
    story.append(Spacer(1, 8))

    # Section 6: Message Templates
    story.append(Paragraph("6. Pre-Approved WhatsApp Message Templates", h1_style))
    
    templates_info = [
        ("Template A: Authentication OTP (Login / Register)",
         "Category: AUTHENTICATION\n"
         "Content: '{{1}} is your Vismo verification code. For your security, do not share this code.'\n"
         "Action: Native [Copy Code] button."),
        ("Template B: Order Confirmation with Attached PDF Invoice",
         "Category: UTILITY (Header Type: Document / PDF)\n"
         "Header Attachment: [Invoice_ORD{{1}}.pdf]\n"
         "Body: 'Hi {{2}}, your order #{{1}} for ₹{{3}} has been confirmed! Your tax invoice is attached above. We are currently picking and packing your items.'\n"
         "Button: [Track Live Status]"),
        ("Template C: Internal Packing Team Notification",
         "Category: UTILITY\n"
         "Body: '📦 NEW ORDER FOR PACKING #{{1}}\n"
         "Items: {{2}} | Total Qty: {{3}} units\n"
         "Please inspect and pack immediately.'\n"
         "Action: [Confirm Packed & Ready]"),
        ("Template D: Delivery Boy Assignment (Triggered Only After Packing)",
         "Category: UTILITY\n"
         "Body: '🛵 READY FOR PICKUP #{{1}}\n"
         "Store Bay: {{2}} | Customer Area: {{3}}\n"
         "Parcel is sealed and verified. Tap to accept delivery run.'\n"
         "Action: [Accept & Open Navigation]")
    ]

    for title, text in templates_info:
        story.append(Paragraph(title, h2_style))
        box_data = [[Paragraph(text.replace('\n', '<br/>'), code_block)]]
        t_box = Table(box_data, colWidths=[487])
        t_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t_box)
        story.append(Spacer(1, 3))

    # Section 7: Actionable Checklist
    story.append(Spacer(1, 5))
    story.append(Paragraph("7. Key Implementation Checklist for Vismo & Developer", h1_style))
    checklist = [
        "<b>Dedicated SIM / Number:</b> Secure a brand-new SIM card for Vismo that has never been activated on WhatsApp mobile.",
        "<b>Business Verification:</b> Prepare Vismo's GST certificate and utility bill for fast-track Meta verification.",
        "<b>Payment Method Setup:</b> Add an international debit/credit card to Meta Business Manager for direct per-message billing at raw Meta rates (~14 paise/msg), avoiding third-party markup fees.",
        "<b>Role-Based Warehouse Portal:</b> Ensure Item #8 (Complete E-Commerce Suite Admin) in the quotation includes an isolated 'Packer View' so warehouse staff can mark items packed without seeing financial data.",
        "<b>SMS Fallback Engine:</b> Implement an automatic fallback queue: if WhatsApp delivery fails or the user does not have WhatsApp within 30 seconds, trigger an SMS OTP via 2Factor or MSG91."
    ]
    for item in checklist:
        story.append(Paragraph(f"✔ {item}", body_style))
        
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    out_dir = r"c:\Users\cool\Desktop\Gravity_studio"
    out_pdf = os.path.join(out_dir, "Vismo_WhatsApp_Order_Architecture_and_Pricing.pdf")
    build_pdf(out_pdf)
    
    # Also write a copy to Desktop directly for quick access
    desktop_copy = r"c:\Users\cool\Desktop\Vismo_WhatsApp_Order_Architecture_and_Pricing.pdf"
    try:
        build_pdf(desktop_copy)
        print(f"SUCCESS: Generated at {out_pdf} and {desktop_copy}")
    except Exception as e:
        print(f"Generated at {out_pdf}, desktop copy error: {e}")
