"""
Farmer Card generation routes.
Generates printable farmer ID cards (front + back) as PDF and JPG,
with QR code, three logos, and farmer details from the database.

Endpoints:
  GET  /api/farmer-card/{resident_id}.pdf   — single card PDF (front + back)
  GET  /api/farmer-card/{resident_id}.jpg   — single card JPG (front only)
  POST /api/farmer-card/bulk.pdf            — multiple cards PDF (body: {ids: [...]})
  GET  /api/farmer-card/{resident_id}/print — HTML print view (opens in browser)
"""
import io
import os
import datetime as dt
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse, HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, auth
from ..utils.audit import record_audit
from ..utils.crypto import decrypt
from ..utils.validation import mask_aadhaar

router = APIRouter(prefix="/farmer-card", tags=["farmer-card"])

# ---------------------------------------------------------------------------
# Card layout constants (ID-1 / CR80 standard: 85.6mm × 54mm)
# ---------------------------------------------------------------------------
CARD_W_MM = 85.6
CARD_H_MM = 54.0
CARD_W_PX = 854   # 10x scale for crisp rendering
CARD_H_PX = 540
GAP_PX = 60       # gap between front & back in composite image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS_DIR = os.path.join(BASE_DIR, "frontend", "assets")

# Logo paths (user can replace these files). We check multiple extensions.
def _find_logo(name):
    """Find a logo file by base name, checking .png, .jpg, .jpeg extensions."""
    for ext in ('.png', '.jpg', '.jpeg'):
        path = os.path.join(ASSETS_DIR, name + ext)
        if os.path.isfile(path):
            return path
    return None

LOGO_RIGHT = _find_logo("card-logo-right") or os.path.join(ASSETS_DIR, "logo.jpeg")
LOGO_LEFT = _find_logo("card-logo-left") or os.path.join(ASSETS_DIR, "logo.jpeg")
LOGO_MIDDLE = _find_logo("agristack-logo") or os.path.join(ASSETS_DIR, "logo.jpeg")
DEFAULT_LOGO = os.path.join(ASSETS_DIR, "logo.jpeg")


def _load_image(path: str, default_path: str = DEFAULT_LOGO):
    """Load an image, falling back to default if missing."""
    from PIL import Image
    if os.path.isfile(path):
        try:
            return Image.open(path).convert("RGBA")
        except Exception:
            pass
    if os.path.isfile(default_path):
        try:
            return Image.open(default_path).convert("RGBA")
        except Exception:
            pass
    return None


def _get_farmer_data(db: Session, resident_id: int, reveal_aadhaar: bool = True) -> dict:
    """Fetch farmer data for the card. Aadhaar is revealed (full number)
    because it's printed on the physical card."""
    r = db.query(models.Resident).filter(models.Resident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    aadhaar = decrypt(r.aadhaar_encrypted) if r.aadhaar_encrypted else None
    return {
        "id": r.id,
        "resident_id": r.resident_id,
        "name": f"{r.first_name} {r.middle_name or ''} {r.last_name or ''}".strip(),
        "first_name": r.first_name,
        "middle_name": r.middle_name,
        "last_name": r.last_name,
        "gender": r.gender or "",
        "dob": r.dob.isoformat() if r.dob else "",
        "address": r.address or "",
        "village": r.village or "",
        "pin_code": r.pin_code or "",
        "mobile": r.mobile_number or "",
        "aadhaar": aadhaar or "",
        "farmer_id": r.farmer_id or r.resident_id,
        "gat_number": r.gat_number or "",
    }


# ---------------------------------------------------------------------------
# Card renderer — uses Pillow to draw the card, then embeds into PDF
# ---------------------------------------------------------------------------
def _draw_card_front(farmer: dict) -> "bytes":
    """Draw the front side of the farmer card. Returns PNG bytes."""
    from PIL import Image, ImageDraw, ImageFont

    W, H = CARD_W_PX, CARD_H_PX
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # --- Border ---
    # Outer green border (agricultural theme)
    draw.rounded_rectangle([0, 0, W - 1, H - 1], radius=24,
                           outline=(34, 139, 34), width=4)
    # Inner thin border
    draw.rounded_rectangle([6, 6, W - 7, H - 7], radius=20,
                           outline=(34, 139, 34, 128), width=1)

    # --- Fonts ---
    def load_font(size, bold=False):
        candidates = [
            "/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.otf" if bold
            else "/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.otf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]
        for c in candidates:
            if os.path.isfile(c):
                try:
                    return ImageFont.truetype(c, size)
                except Exception:
                    continue
        return ImageFont.load_default()

    font_title = load_font(22, bold=True)
    font_label = load_font(13, bold=True)
    font_value = load_font(16, bold=True)
    font_small = load_font(11)
    font_header = load_font(14, bold=True)

    # --- Header band ---
    header_h = 110
    # Light green header background
    overlay = Image.new("RGBA", (W, header_h), (240, 255, 240, 255))
    img.paste(overlay, (0, 0), overlay)
    draw.rounded_rectangle([0, 0, W - 1, header_h], radius=24,
                           fill=(240, 255, 240, 255))

    # --- Logos ---
    # Logo 1: top-left
    logo_left = _load_image(LOGO_LEFT)
    if logo_left:
        logo_left = logo_left.resize((70, 70), Image.LANCZOS)
        img.paste(logo_left, (16, 20), logo_left)

    # Logo 2: top-right
    logo_right = _load_image(LOGO_RIGHT)
    if logo_right:
        logo_right = logo_right.resize((70, 70), Image.LANCZOS)
        img.paste(logo_right, (W - 86, 20), logo_right)

    # Logo 3: top-middle (AgriStack horizontal)
    logo_mid = _load_image(LOGO_MIDDLE)
    if logo_mid:
        # Keep aspect ratio, fit within 180x40
        lw, lh = logo_mid.size
        max_w, max_h = 180, 40
        ratio = min(max_w / lw, max_h / lh)
        new_w, new_h = int(lw * ratio), int(lh * ratio)
        logo_mid = logo_mid.resize((new_w, new_h), Image.LANCZOS)
        mx = (W - new_w) // 2
        img.paste(logo_mid, (mx, 12), logo_mid)
        # "AgriStack" text below logo if logo is small
        draw.text((W // 2, 56), "AgriStack", fill=(34, 139, 34),
                  font=font_header, anchor="mm")
    else:
        # Text-only AgriStack header
        draw.text((W // 2, 30), "AgriStack", fill=(34, 139, 34),
                  font=load_font(20, bold=True), anchor="mm")
        draw.text((W // 2, 56), "किसान परिचय पत्र", fill=(34, 139, 34),
                  font=font_small, anchor="mm")

    # --- Farmer details (left side) ---
    detail_x = 24
    detail_y = header_h + 20
    line_h = 38

    def draw_field(y, label, value, label_mr=""):
        draw.text((detail_x, y), label, fill=(100, 100, 100), font=font_label)
        if label_mr:
            draw.text((detail_x + 130, y), label_mr, fill=(100, 100, 100), font=font_small)
        draw.text((detail_x, y + 14), value or "—", fill=(20, 20, 20), font=font_value)

    # Mask Aadhaar on card for security (show last 4)
    aadhaar_display = mask_aadhaar(farmer["aadhaar"]) if farmer["aadhaar"] else "—"

    draw_field(detail_y, "Farmer Name:", farmer["name"], "शेतकरीचे नाव")
    draw_field(detail_y + line_h, "Aadhaar No:", aadhaar_display, "आधार नंबर")
    draw_field(detail_y + line_h * 2, "Farmer ID:", farmer["farmer_id"], "शेतकरी आयडी")
    draw_field(detail_y + line_h * 3, "गट नंबर:", farmer["gat_number"], "Gat Number")
    draw_field(detail_y + line_h * 4, "Mobile No:", farmer["mobile"], "मोबाइल नंबर")

    # --- QR code (right side) ---
    qr_data = (
        f"Name: {farmer['name']}\n"
        f"Farmer ID: {farmer['farmer_id']}\n"
        f"Aadhaar: {aadhaar_display}\n"
        f"गट नंबर: {farmer['gat_number']}\n"
        f"Mobile: {farmer['mobile']}\n"
        f"Village: {farmer['village']}"
    )
    try:
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=4, border=1,
                           error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
        qr_size = 130
        qr_img = qr_img.resize((qr_size, qr_size), Image.NEAREST)
        img.paste(qr_img, (W - qr_size - 24, detail_y), qr_img)
    except Exception:
        pass  # QR is optional

    # --- Footer ---
    draw.text((W // 2, H - 16), "आशापुरी कॉम्प्युटर सर्विस कर्ले 💻",
              fill=(34, 139, 34), font=font_small, anchor="mm")

    # Convert to RGB for output
    out = Image.new("RGB", (W, H), (255, 255, 255))
    out.paste(img, (0, 0), img)
    buf = io.BytesIO()
    out.save(buf, format="PNG", dpi=(300, 300))
    return buf.getvalue()


def _draw_card_back(farmer: dict) -> "bytes":
    """Draw the back side of the farmer card. Returns PNG bytes."""
    from PIL import Image, ImageDraw, ImageFont

    W, H = CARD_W_PX, CARD_H_PX
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Border
    draw.rounded_rectangle([0, 0, W - 1, H - 1], radius=24,
                           outline=(34, 139, 34), width=4)
    draw.rounded_rectangle([6, 6, W - 7, H - 7], radius=20,
                           outline=(34, 139, 34, 128), width=1)

    def load_font(size, bold=False):
        candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]
        for c in candidates:
            if os.path.isfile(c):
                try:
                    return ImageFont.truetype(c, size)
                except Exception:
                    continue
        return ImageFont.load_default()

    font_title = load_font(18, bold=True)
    font_label = load_font(13, bold=True)
    font_value = load_font(16, bold=True)
    font_small = load_font(11)

    # Header band
    header_h = 50
    overlay = Image.new("RGBA", (W, header_h), (240, 255, 240, 255))
    img.paste(overlay, (0, 0), overlay)
    draw.text((W // 2, header_h // 2), "किसान तपशील / Farmer Details",
              fill=(34, 139, 34), font=font_title, anchor="mm")

    # Fields
    detail_x = 24
    detail_y = header_h + 25
    line_h = 42

    def draw_field(y, label, value, label_mr=""):
        draw.text((detail_x, y), label, fill=(100, 100, 100), font=font_label)
        if label_mr:
            draw.text((detail_x + 110, y), label_mr, fill=(100, 100, 100), font=font_small)
        draw.text((detail_x, y + 15), value or "—", fill=(20, 20, 20), font=font_value)

    draw_field(detail_y, "Name:", farmer["name"], "नाव")
    draw_field(detail_y + line_h, "DOB:", farmer["dob"], "जन्म तारीख")
    draw_field(detail_y + line_h * 2, "Gender:", farmer["gender"], "लिंग")
    # Address may be long — wrap it
    address = farmer["address"]
    if farmer["village"]:
        address = f"{address}, {farmer['village']}" if address else farmer["village"]
    if farmer["pin_code"]:
        address = f"{address} - {farmer['pin_code']}" if address else farmer["pin_code"]
    draw_field(detail_y + line_h * 3, "Address:", address[:50], "पत्ता")
    if len(address) > 50:
        draw.text((detail_x, detail_y + line_h * 3 + 30), address[50:100],
                  fill=(20, 20, 20), font=font_value)

    # Footer
    draw.text((W // 2, H - 16), "आशापुरी कॉम्प्युटर सर्विस कर्ले 💻",
              fill=(34, 139, 34), font=font_small, anchor="mm")

    out = Image.new("RGB", (W, H), (255, 255, 255))
    out.paste(img, (0, 0), img)
    buf = io.BytesIO()
    out.save(buf, format="PNG", dpi=(300, 300))
    return buf.getvalue()


def _make_pdf(farmers: List[dict]) -> bytes:
    """Combine front + back of each farmer into a single PDF.
    Layout: 2 cards per row (front | back), multiple rows for multiple farmers.
    """
    from PIL import Image as PILImage
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Image as RLImage, Spacer, Table, TableStyle
    from reportlab.lib import colors

    buf = io.BytesIO()
    page_size = landscape(A4)
    doc = SimpleDocTemplate(buf, pagesize=page_size,
                            topMargin=10 * mm, bottomMargin=10 * mm,
                            leftMargin=10 * mm, rightMargin=10 * mm)

    story = []
    # Each row has multiple cards: front and back side by side
    # Card display size
    card_disp_w = 80 * mm
    card_disp_h = 50 * mm
    per_row = 3
    col_w = [card_disp_w + 5 * mm] * per_row

    # Group farmers into rows of 3 (3 farmers = 6 card images per row)
    rows = [farmers[i:i + per_row] for i in range(0, len(farmers), per_row)]

    for row in rows:
        # Build a table: each cell is a card image
        front_imgs = []
        back_imgs = []
        for f in row:
            front_png = _draw_card_front(f)
            back_png = _draw_card_back(f)
            front_imgs.append(RLImage(io.BytesIO(front_png), width=card_disp_w, height=card_disp_h))
            back_imgs.append(RLImage(io.BytesIO(back_png), width=card_disp_w, height=card_disp_h))

        # Pad row if fewer than per_row
        while len(front_imgs) < per_row:
            front_imgs.append("")
            back_imgs.append("")

        # Front row
        front_table = Table([front_imgs], colWidths=col_w)
        front_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(front_table)
        story.append(Spacer(1, 3 * mm))

        # Back row
        back_table = Table([back_imgs], colWidths=col_w)
        back_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(back_table)
        story.append(Spacer(1, 8 * mm))

    doc.build(story)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/{resident_id}.pdf")
def get_farmer_card_pdf(resident_id: int, request: Request,
                        db: Session = Depends(get_db),
                        user: models.User = Depends(auth.require_admin_or_operator)):
    """Single farmer card as PDF (front + back side by side)."""
    farmer = _get_farmer_data(db, resident_id)
    pdf_bytes = _make_pdf([farmer])
    record_audit(db, user, "download_card", "farmer_card", str(resident_id),
                 f"Downloaded farmer card PDF for {farmer['name']}", request)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="farmer_card_{resident_id}.pdf"'},
    )


@router.get("/{resident_id}.jpg")
def get_farmer_card_jpg(resident_id: int, request: Request,
                        db: Session = Depends(get_db),
                        user: models.User = Depends(auth.require_admin_or_operator)):
    """Single farmer card front side as JPG."""
    from PIL import Image
    farmer = _get_farmer_data(db, resident_id)
    png_bytes = _draw_card_front(farmer)
    # Convert PNG to JPG
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95, dpi=(300, 300))
    record_audit(db, user, "download_card", "farmer_card", str(resident_id),
                 f"Downloaded farmer card JPG for {farmer['name']}", request)
    return Response(
        content=buf.getvalue(),
        media_type="image/jpeg",
        headers={"Content-Disposition": f'attachment; filename="farmer_card_{resident_id}.jpg"'},
    )


class BulkCardRequest(BaseModel):
    ids: List[int] = Field(..., min_length=1, max_length=500)


@router.post("/bulk.pdf")
def get_bulk_farmer_cards(payload: BulkCardRequest, request: Request,
                          db: Session = Depends(get_db),
                          user: models.User = Depends(auth.require_admin_or_operator)):
    """Multiple farmer cards as a single PDF (front + back for each)."""
    farmers = []
    for rid in payload.ids:
        try:
            farmers.append(_get_farmer_data(db, rid))
        except HTTPException:
            continue  # skip missing farmers
    if not farmers:
        raise HTTPException(status_code=404, detail="No valid farmers found for given IDs.")
    pdf_bytes = _make_pdf(farmers)
    record_audit(db, user, "download_card", "farmer_card", None,
                 f"Downloaded bulk farmer card PDF ({len(farmers)} farmers)", request)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="farmer_cards_{len(farmers)}.pdf"'},
    )


@router.get("/{resident_id}/print")
def print_farmer_card(resident_id: int,
                      db: Session = Depends(get_db),
                      user: models.User = Depends(auth.require_admin_or_operator)):
    """HTML print view of the farmer card (opens in browser, user can print)."""
    farmer = _get_farmer_data(db, resident_id)
    aadhaar_display = mask_aadhaar(farmer["aadhaar"]) if farmer["aadhaar"] else "—"
    html = f"""<!doctype html>
<html><head><title>Farmer Card - {farmer['name']}</title>
<style>
  @page {{ size: landscape; margin: 10mm; }}
  body {{ font-family: 'Segoe UI', sans-serif; background: #f0f0f0; padding: 20px; }}
  .card-container {{ display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }}
  .card {{
    width: 85.6mm; height: 54mm; border: 3px solid #228B22; border-radius: 12px;
    padding: 8mm; box-sizing: border-box; background: white; position: relative;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }}
  .card h3 {{ margin: 0 0 5px 0; color: #228B22; font-size: 11pt; text-align: center; }}
  .field {{ margin: 3px 0; font-size: 8pt; }}
  .field .label {{ color: #666; font-weight: bold; display: inline-block; width: 80px; }}
  .field .value {{ color: #222; font-weight: 600; }}
  .footer {{ position: absolute; bottom: 5px; left: 0; right: 0; text-align: center;
             font-size: 7pt; color: #228B22; }}
  .logos {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }}
  .logo {{ width: 50px; height: 50px; object-fit: contain; }}
  .agristack {{ text-align: center; color: #228B22; font-weight: bold; font-size: 10pt; }}
  .no-print {{ margin: 20px; text-align: center; }}
  @media print {{ .no-print {{ display: none; }} body {{ background: white; padding: 0; }} }}
</style></head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="padding:10px 20px;font-size:14pt;cursor:pointer;">🖨️ Print Card</button>
    <a href="/api/farmer-card/{resident_id}.pdf" style="margin-left:10px;padding:10px 20px;font-size:14pt;background:#228B22;color:white;text-decoration:none;border-radius:4px;">📄 Download PDF</a>
  </div>
  <div class="card-container">
    <div class="card">
      <div class="logos">
        <img src="/assets/card-logo-left.png" class="logo" onerror="this.src='/assets/logo.jpeg';this.onerror=null;" />
        <div class="agristack"><img src="/assets/agristack-logo.jpg" style="height:30px;object-fit:contain;" onerror="this.style.display='none';" /><br><small>किसान परिचय पत्र</small></div>
        <img src="/assets/card-logo-right.png" class="logo" onerror="this.src='/assets/logo.jpeg';this.onerror=null;" />
      </div>
      <h3>किसान परिचय पत्र</h3>
      <div class="field"><span class="label">Farmer Name:</span> <span class="value">{farmer['name']}</span></div>
      <div class="field"><span class="label">Aadhaar No:</span> <span class="value">{aadhaar_display}</span></div>
      <div class="field"><span class="label">Farmer ID:</span> <span class="value">{farmer['farmer_id']}</span></div>
      <div class="field"><span class="label">गट नंबर:</span> <span class="value">{farmer['gat_number']}</span></div>
      <div class="field"><span class="label">Mobile:</span> <span class="value">{farmer['mobile']}</span></div>
      <div class="footer">आशापुरी कॉम्प्युटर सर्विस कर्ले 💻</div>
    </div>
    <div class="card">
      <h3>किसान तपशील / Farmer Details</h3>
      <div class="field"><span class="label">Name:</span> <span class="value">{farmer['name']}</span></div>
      <div class="field"><span class="label">DOB:</span> <span class="value">{farmer['dob'] or '—'}</span></div>
      <div class="field"><span class="label">Gender:</span> <span class="value">{farmer['gender']}</span></div>
      <div class="field"><span class="label">Address:</span> <span class="value">{farmer['address']}, {farmer['village']} - {farmer['pin_code']}</span></div>
      <div class="footer">आशापुरी कॉम्प्युटर सर्विस कर्ले 💻</div>
    </div>
  </div>
</body></html>"""
    return HTMLResponse(content=html)
