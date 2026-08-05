/**
 * Farmer Card Template — generates HTML for front and back of the card.
 * Used for: live preview, print-to-PDF, and html2canvas JPG capture.
 *
 * The card is ID-1 size (85.6mm × 54mm) for print.
 * For preview, the card is scaled with CSS transform.
 *
 * IMPORTANT: The API returns separate fields (first_name, middle_name,
 * last_name, mobile_number). We combine them into display values here.
 */

/**
 * Combine farmer name from separate API fields.
 */
function getFarmerName(farmer) {
  const parts = [farmer.first_name, farmer.middle_name, farmer.last_name]
    .filter(p => p && p.trim());
  return parts.join(' ').trim() || '—';
}

/**
 * Returns the CSS for the card. Include in <head> or <style>.
 */
function cardStyles() {
  return `
    <style>
      .farmer-card {
        width: 85.6mm;
        height: 54mm;
        border: 2.5px solid #16a34a;
        border-radius: 10px;
        padding: 4mm 5mm;
        box-sizing: border-box;
        background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
        position: relative;
        font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Mangal', 'Segoe UI', sans-serif;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .farmer-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1.5mm;
        background: linear-gradient(90deg, #16a34a, #22c55e, #16a34a);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 12mm;
        margin-bottom: 1.5mm;
        margin-top: 1mm;
      }
      .card-logo {
        height: 10mm;
        max-width: 16mm;
        object-fit: contain;
      }
      .card-agristack {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5mm;
      }
      .card-agristack img {
        height: 5mm;
        object-fit: contain;
      }
      .card-agristack-text {
        color: #16a34a;
        font-weight: 700;
        font-size: 9pt;
        line-height: 1;
      }
      .card-agristack-sub {
        color: #15803d;
        font-size: 7pt;
        line-height: 1;
      }
      .card-title {
        text-align: center;
        color: #15803d;
        font-weight: 700;
        font-size: 10pt;
        margin-bottom: 2mm;
        border-bottom: 1px solid #86efac;
        padding-bottom: 1mm;
      }
      .card-fields {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1.5mm;
      }
      .card-field {
        display: flex;
        align-items: baseline;
        gap: 1mm;
      }
      .card-field-label {
        color: #6b7280;
        font-weight: 600;
        font-size: 8pt;
        min-width: 28mm;
        white-space: nowrap;
      }
      .card-field-value {
        color: #1f2937;
        font-weight: 700;
        font-size: 9pt;
        word-break: break-all;
        flex: 1;
      }
      .card-field-name .card-field-value {
        font-size: 10pt;
        color: #111827;
      }

      /* Back side */
      .card-back-title {
        text-align: center;
        color: #15803d;
        font-weight: 700;
        font-size: 10pt;
        margin-bottom: 2.5mm;
        border-bottom: 1px solid #86efac;
        padding-bottom: 1mm;
      }
      .card-back-fields {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2mm;
      }
      .card-back-field {
        display: flex;
        align-items: baseline;
        gap: 1mm;
      }
      .card-back-label {
        color: #6b7280;
        font-weight: 600;
        font-size: 8pt;
        min-width: 20mm;
      }
      .card-back-value {
        color: #1f2937;
        font-weight: 700;
        font-size: 9pt;
        flex: 1;
      }

      /* Print layout */
      @media print {
        @page { size: A4 portrait; margin: 8mm; }
        body { margin: 0; padding: 0; }
        .no-print { display: none !important; }
        .print-single {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8mm;
          padding-top: 20mm;
        }
        .print-bulk-row {
          display: flex;
          gap: 3mm;
          justify-content: center;
          margin-bottom: 3mm;
        }
        .print-bulk-row > .farmer-card {
          transform: scale(0.72);
          transform-origin: top left;
          margin-bottom: -15mm;
        }
        .page-break { page-break-after: always; }
      }
    </style>
  `;
}

/**
 * Returns HTML for the front side of the card.
 * QR code removed per user request.
 */
function cardFrontHTML(farmer) {
  const name = getFarmerName(farmer);
  const aadhaarMasked = farmer.aadhaar_masked ||
    (farmer.aadhaar ? 'XXXX XXXX ' + farmer.aadhaar.slice(-4) : '—');
  const mobile = farmer.mobile_number || farmer.mobile || '—';

  return `
    <div class="farmer-card card-front">
      <div class="card-header">
        <img src="/assets/card-logo-left.png" class="card-logo" onerror="this.style.display='none'" />
        <div class="card-agristack">
          <img src="/assets/agristack-logo.jpg" alt="AgriStack" onerror="this.style.display='none'" />
          <div class="card-agristack-text">AgriStack</div>
          <div class="card-agristack-sub">किसान परिचय पत्र</div>
        </div>
        <img src="/assets/card-logo-right.png" class="card-logo" onerror="this.style.display='none'" />
      </div>
      <div class="card-title">किसान परिचय पत्र / Farmer ID Card</div>
      <div class="card-fields">
        <div class="card-field card-field-name">
          <span class="card-field-label">नाव / Name:</span>
          <span class="card-field-value">${escapeHtml(name)}</span>
        </div>
        <div class="card-field">
          <span class="card-field-label">आधार / Aadhaar:</span>
          <span class="card-field-value">${escapeHtml(aadhaarMasked)}</span>
        </div>
        <div class="card-field">
          <span class="card-field-label">शेतकरी आयडी / Farmer ID:</span>
          <span class="card-field-value">${escapeHtml(farmer.farmer_id || '—')}</span>
        </div>
        <div class="card-field">
          <span class="card-field-label">गट नंबर:</span>
          <span class="card-field-value">${escapeHtml(farmer.gat_number || '—')}</span>
        </div>
        <div class="card-field">
          <span class="card-field-label">मोबाइल / Mobile:</span>
          <span class="card-field-value">${escapeHtml(mobile)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns HTML for the back side of the card.
 * Labels in Marathi only. No footer.
 */
function cardBackHTML(farmer) {
  const name = getFarmerName(farmer);
  const address = [farmer.address, farmer.village, farmer.pin_code]
    .filter(Boolean).join(', ');

  return `
    <div class="farmer-card card-back">
      <div class="card-back-title">किसान तपशील / Farmer Details</div>
      <div class="card-back-fields">
        <div class="card-back-field">
          <span class="card-back-label">नाव:</span>
          <span class="card-back-value">${escapeHtml(name)}</span>
        </div>
        <div class="card-back-field">
          <span class="card-back-label">जन्म तारीख:</span>
          <span class="card-back-value">${escapeHtml(farmer.dob || '—')}</span>
        </div>
        <div class="card-back-field">
          <span class="card-back-label">लिंग:</span>
          <span class="card-back-value">${escapeHtml(farmer.gender || '—')}</span>
        </div>
        <div class="card-back-field">
          <span class="card-back-label">पत्ता:</span>
          <span class="card-back-value">${escapeHtml(address || '—')}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Opens a print window with the appropriate layout.
 * @param {Array} farmers - array of farmer objects
 * @param {boolean} isBulk - if true, 3-per-page layout; if false, single card
 */
function printFarmerCards(farmers, isBulk) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { toast('Pop-up blocked. Please allow pop-ups.', 'error'); return; }

  let bodyContent;
  if (isBulk) {
    // 3 farmers per page: front row + back row
    const pages = [];
    for (let i = 0; i < farmers.length; i += 3) {
      const chunk = farmers.slice(i, i + 3);
      const frontRow = chunk.map(f => cardFrontHTML(f)).join('');
      const backRow = chunk.map(f => cardBackHTML(f)).join('');
      pages.push(`
        <div class="print-bulk-row">${frontRow}</div>
        <div class="print-bulk-row">${backRow}</div>
      `);
    }
    bodyContent = pages.map((p, i) =>
      `<div class="${i < pages.length - 1 ? 'page-break' : ''}">${p}</div>`
    ).join('');
  } else {
    // Single farmer: front + back stacked
    const f = farmers[0];
    bodyContent = `
      <div class="print-single">
        ${cardFrontHTML(f)}
        ${cardBackHTML(f)}
      </div>
    `;
  }

  w.document.write(`
    <!doctype html>
    <html lang="mr">
    <head>
      <meta charset="UTF-8" />
      <title>Farmer Card${farmers.length > 1 ? 's' : ''}</title>
      ${cardStyles()}
    </head>
    <body>
      <div class="no-print" style="position:fixed;top:10px;left:10px;z-index:999;background:white;padding:10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
        <button onclick="window.print()" style="padding:8px 16px;font-size:14px;cursor:pointer;background:#16a34a;color:white;border:none;border-radius:6px;">🖨️ Print / Save as PDF</button>
      </div>
      ${bodyContent}
    </body>
    </html>
  `);
  w.document.close();
  // Auto-trigger print after images load
  w.onload = () => {
    setTimeout(() => w.print(), 500);
  };
}

/**
 * Captures a card element as JPG using html2canvas.
 * @param {HTMLElement} element - the card element to capture
 * @param {string} filename - download filename
 */
async function captureCardAsJPG(element, filename) {
  if (typeof html2canvas === 'undefined') {
    toast('JPG library not loaded. Please refresh.', 'error');
    return;
  }
  try {
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Card downloaded as JPG', 'success');
  } catch (e) {
    toast('JPG capture failed: ' + e.message, 'error');
  }
}

// Expose globally
window.cardStyles = cardStyles;
window.cardFrontHTML = cardFrontHTML;
window.cardBackHTML = cardBackHTML;
window.getFarmerName = getFarmerName;
window.printFarmerCards = printFarmerCards;
window.captureCardAsJPG = captureCardAsJPG;
