import jsPDF from 'jspdf';

/**
 * FlyBy Professional Mission Report — PDF Generation Service
 * 
 * Generates beautifully designed A4 landscape PDFs with:
 * - FlyBy official logo
 * - Professional typography and spacing
 * - Section dividers and modern tables
 * - Status badges and colour coding
 * - Company branding support
 */

// ─── Logo Loading ───────────────────────────────────────────────────────────
let logoDataUrl = null;

/**
 * Load the FlyBy logo as a data URL for embedding in PDFs.
 * Uses the official logo from /flyby-icon-512.png.
 */
async function loadLogo() {
  if (logoDataUrl) return logoDataUrl;
  try {
    const response = await fetch('/flyby-icon-512.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => { logoDataUrl = reader.result; resolve(logoDataUrl); };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[PDF] Logo load failed:', err.message);
    return null;
  }
}

// ─── Design Tokens ──────────────────────────────────────────────────────────
const COLORS = {
  primary: [22, 163, 74],        // #16A34A
  primaryDark: [21, 128, 61],    // #15803D
  secondary: [15, 23, 42],       // #0F172A
  text: [15, 23, 42],            // #0F172A
  textSecondary: [100, 116, 139],// #64748B
  textTertiary: [148, 163, 184], // #94A3B8
  white: [255, 255, 255],
  background: [248, 250, 252],   // #F8FAFC
  surface: [241, 245, 249],      // #F1F5F9
  border: [226, 232, 240],       // #E2E8F0
  success: [22, 163, 74],
  error: [239, 68, 68],
  warning: [245, 158, 11],
  info: [59, 130, 246],
};

const FONTS = {
  heading: 'helvetica',
  body: 'helvetica',
};

// A4 Landscape dimensions in mm
const PAGE = {
  width: 297,
  height: 210,
  marginLeft: 20,
  marginRight: 20,
  marginTop: 20,
  marginBottom: 20,
  contentWidth: 257, // 297 - 20 - 20
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}

// ─── PDF Builder ────────────────────────────────────────────────────────────

class ReportPDFBuilder {
  constructor(reportData) {
    this.data = reportData;
    this.doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    this.y = PAGE.marginTop;
    this.pageNum = 1;
    this.totalPages = 1; // Will be updated
  }

  // ─── Core Drawing Methods ─────────────────────────────────────────────────

  setColor(rgb) {
    this.doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  setFillColor(rgb) {
    this.doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  }

  setDrawColor(rgb) {
    this.doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  }

  checkPageBreak(requiredSpace = 30) {
    if (this.y + requiredSpace > PAGE.height - PAGE.marginBottom - 15) {
      this.addFooter();
      this.doc.addPage();
      this.pageNum++;
      this.y = PAGE.marginTop;
      return true;
    }
    return false;
  }

  // ─── Header ───────────────────────────────────────────────────────────────

  addHeader() {
    const doc = this.doc;
    const d = this.data;

    // Background gradient bar
    this.setFillColor(COLORS.secondary);
    doc.rect(0, 0, PAGE.width, 52, 'F');

    // Subtle watermark text
    doc.setFont(FONTS.heading, 'bold');
    doc.setFontSize(72);
    this.setColor([255, 255, 255]);
    doc.setGState(new doc.GState({ opacity: 0.03 }));
    doc.text('FLYBY', PAGE.width / 2, 38, { align: 'center' });
    doc.setGState(new doc.GState({ opacity: 1 }));

    // FlyBy Logo image (if loaded)
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', PAGE.marginLeft, 6, 16, 16);
      } catch { /* logo embed failed — continue with text */ }
    }

    // FlyBy Logo text (positioned after image)
    const textX = logoDataUrl ? PAGE.marginLeft + 19 : PAGE.marginLeft;
    doc.setFontSize(20);
    doc.setFont(FONTS.heading, 'bold');
    this.setColor(COLORS.white);
    doc.text('FLY', textX, 17);
    this.setColor(COLORS.primary);
    const flyWidth = doc.getTextWidth('FLY');
    doc.text('BY', textX + flyWidth, 17);

    // By Feldrix
    doc.setFontSize(6);
    doc.setFont(FONTS.body, 'bold');
    this.setColor(COLORS.textTertiary);
    doc.text('BY FELDRIX', textX, 22);

    // Smart Drone Operations tagline
    doc.setFontSize(5.5);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.primary);
    doc.text('SMART DRONE OPERATIONS', textX, 26);

    // Report title
    doc.setFontSize(16);
    doc.setFont(FONTS.heading, 'bold');
    this.setColor(COLORS.white);
    doc.text('MISSION REPORT', PAGE.marginLeft, 40);

    doc.setFontSize(8);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.textTertiary);
    doc.text('Professional Agricultural Drone Operations', PAGE.marginLeft, 46);

    // Right side — Report number & date
    doc.setFontSize(9);
    doc.setFont(FONTS.body, 'bold');
    this.setColor(COLORS.primary);
    doc.text(d.generated?.report_number || '', PAGE.width - PAGE.marginRight, 22, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.textTertiary);
    doc.text(formatDate(d.generated?.generated_at), PAGE.width - PAGE.marginRight, 28, { align: 'right' });

    // Mission number badge
    if (d.mission?.mission_number) {
      const missionNum = d.mission.mission_number;
      doc.setFontSize(10);
      doc.setFont(FONTS.heading, 'bold');
      this.setColor(COLORS.white);
      doc.text(missionNum, PAGE.width - PAGE.marginRight, 40, { align: 'right' });
    }

    // Status badge
    if (d.mission?.status) {
      const statusText = d.mission.status.toUpperCase();
      const badgeWidth = doc.getTextWidth(statusText) + 8;
      const badgeX = PAGE.width - PAGE.marginRight - badgeWidth;
      this.setFillColor(COLORS.primary);
      doc.roundedRect(badgeX, 42, badgeWidth, 6, 1.5, 1.5, 'F');
      doc.setFontSize(6);
      doc.setFont(FONTS.body, 'bold');
      this.setColor(COLORS.white);
      doc.text(statusText, badgeX + badgeWidth / 2, 46, { align: 'center' });
    }

    this.y = 62;
  }

  // ─── Section Title ────────────────────────────────────────────────────────

  addSectionTitle(title) {
    this.checkPageBreak(20);
    const doc = this.doc;

    // Green accent line
    this.setFillColor(COLORS.primary);
    doc.rect(PAGE.marginLeft, this.y, 3, 8, 'F');

    // Title text
    doc.setFontSize(11);
    doc.setFont(FONTS.heading, 'bold');
    this.setColor(COLORS.secondary);
    doc.text(title.toUpperCase(), PAGE.marginLeft + 7, this.y + 6);

    // Subtle underline
    this.setDrawColor(COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginLeft, this.y + 11, PAGE.width - PAGE.marginRight, this.y + 11);

    this.y += 16;
  }

  // ─── Data Table (key-value pairs in columns) ──────────────────────────────

  addDataGrid(items, columns = 3) {
    const doc = this.doc;
    const colWidth = PAGE.contentWidth / columns;
    let col = 0;
    let startY = this.y;

    items.forEach(([label, value]) => {
      if (col >= columns) {
        col = 0;
        startY += 14;
        this.checkPageBreak(14);
        if (this.y > startY) startY = this.y;
      }

      const x = PAGE.marginLeft + (col * colWidth);

      // Label
      doc.setFontSize(6.5);
      doc.setFont(FONTS.body, 'normal');
      this.setColor(COLORS.textTertiary);
      doc.text(label.toUpperCase(), x, startY);

      // Value
      doc.setFontSize(9);
      doc.setFont(FONTS.body, 'bold');
      this.setColor(COLORS.text);
      const displayValue = value != null && value !== '' ? String(value) : '—';
      doc.text(displayValue.substring(0, 40), x, startY + 5);

      col++;
    });

    this.y = startY + 14;
  }

  // ─── Info Box (notes, text blocks) ────────────────────────────────────────

  addInfoBox(label, text) {
    if (!text) return;
    this.checkPageBreak(20);
    const doc = this.doc;

    this.setFillColor(COLORS.surface);
    doc.roundedRect(PAGE.marginLeft, this.y, PAGE.contentWidth, 16, 2, 2, 'F');

    doc.setFontSize(6.5);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.textTertiary);
    doc.text(label.toUpperCase(), PAGE.marginLeft + 4, this.y + 5);

    doc.setFontSize(8);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.text);
    const lines = doc.splitTextToSize(String(text), PAGE.contentWidth - 8);
    doc.text(lines.slice(0, 2), PAGE.marginLeft + 4, this.y + 11);

    this.y += 20;
  }

  // ─── Mission Information Section ──────────────────────────────────────────

  addMissionInformation() {
    const m = this.data.mission;
    if (!m) return;

    this.addSectionTitle('Mission Information');
    this.addDataGrid([
      ['Mission Number', m.mission_number],
      ['Status', m.status],
      ['Mission Type', m.mission_type],
      ['Priority', m.priority],
      ['Scheduled Date', formatDate(m.scheduled_date)],
      ['Start Time', formatTime(m.started_at)],
      ['Finish Time', formatTime(m.completed_at)],
      ['Duration', m.actual_duration ? `${m.actual_duration} minutes` : null],
      ['Dispatcher', this.data.generated?.generated_by],
      ['Pilot', this.data.pilot?.name],
      ['Aircraft', this.data.aircraft?.name],
      ['Battery', this.data.battery?.code],
    ], 4);
  }

  // ─── Customer Information Section ─────────────────────────────────────────

  addCustomerInformation() {
    const m = this.data.mission;
    const c = this.data.customer;
    const f = this.data.field;

    this.addSectionTitle('Customer & Application Details');
    this.addDataGrid([
      ['Customer', c?.name],
      ['Farm', this.data.farm?.name],
      ['Field', f?.name],
      ['Crop', m?.crop || f?.crop],
      ['Area Sprayed', m?.actual_area ? `${m.actual_area} ha` : (f?.area_hectares ? `${f.area_hectares} ha` : null)],
      ['Application Type', m?.application_type],
      ['Chemical Used', m?.chemical_name],
      ['Application Rate', m?.chemical_rate ? `${m.chemical_rate} L/ha` : null],
    ], 4);

    if (m?.dispatcher_notes) {
      this.addInfoBox('Dispatcher Notes', m.dispatcher_notes);
    }
    if (m?.completion_notes) {
      this.addInfoBox('Pilot Notes', m.completion_notes);
    }
  }

  // ─── Weather Snapshot Section ─────────────────────────────────────────────

  addWeatherSnapshot() {
    const w = this.data.weather;
    if (!w || (!w.temperature && !w.humidity && !w.wind_speed)) return;

    this.addSectionTitle('Weather Snapshot');

    const riskColor = w.risk_level === 'High' ? COLORS.error :
                      w.risk_level === 'Medium' ? COLORS.warning : COLORS.success;

    this.addDataGrid([
      ['Temperature', w.temperature != null ? `${w.temperature}°C` : null],
      ['Humidity', w.humidity != null ? `${w.humidity}%` : null],
      ['Wind Speed', w.wind_speed != null ? `${w.wind_speed} km/h` : null],
      ['Wind Direction', w.wind_direction],
      ['Rain Probability', w.rain_probability != null ? `${w.rain_probability}%` : null],
      ['Recommendation', w.recommendation],
      ['Safe Spray Window', w.spray_window],
      ['Weather Risk', w.risk_level],
    ], 4);
  }

  // ─── Mission Timeline Section ─────────────────────────────────────────────

  addTimeline() {
    const timeline = this.data.timeline;
    if (!timeline || timeline.length === 0) return;

    this.addSectionTitle('Mission Timeline');
    const doc = this.doc;

    const eventIcons = {
      created: '○', planned: '◎', dispatched: '▷', checklist_complete: '✓',
      takeoff: '▲', flying: '●', paused: '‖', resumed: '▶',
      landing: '▼', completed: '★', cancelled: '✕', aborted: '⚠', emergency: '⚡', note: '•',
    };

    timeline.forEach((event, i) => {
      this.checkPageBreak(12);
      const x = PAGE.marginLeft;

      // Timeline dot
      this.setFillColor(event.event_type === 'completed' ? COLORS.success :
                        event.event_type === 'emergency' || event.event_type === 'aborted' ? COLORS.error :
                        COLORS.primary);
      doc.circle(x + 3, this.y + 3, 2, 'F');

      // Connector line
      if (i < timeline.length - 1) {
        this.setDrawColor(COLORS.border);
        doc.setLineWidth(0.3);
        doc.line(x + 3, this.y + 5.5, x + 3, this.y + 11);
      }

      // Event label
      doc.setFontSize(8);
      doc.setFont(FONTS.body, 'bold');
      this.setColor(COLORS.text);
      doc.text(event.event_label || event.event_type, x + 10, this.y + 4);

      // Time & user
      doc.setFontSize(6.5);
      doc.setFont(FONTS.body, 'normal');
      this.setColor(COLORS.textSecondary);
      const meta = `${formatTime(event.created_at)} • ${event.user_name || 'System'}`;
      doc.text(meta, x + 10, this.y + 9);

      // Notes
      if (event.notes) {
        doc.setFontSize(6.5);
        this.setColor(COLORS.textTertiary);
        doc.text(event.notes.substring(0, 80), x + 80, this.y + 4);
      }

      this.y += 12;
    });
  }

  // ─── Field Information Section ────────────────────────────────────────────

  addFieldInformation() {
    const f = this.data.field;
    const farm = this.data.farm;
    if (!f) return;

    this.addSectionTitle('Field Information');
    this.addDataGrid([
      ['Customer', this.data.customer?.name],
      ['Farm', farm?.name],
      ['Field', f.name],
      ['Crop', f.crop],
      ['Area', f.area_hectares ? `${f.area_hectares} ha` : null],
      ['Boundary Available', f.boundary_available ? 'Yes' : 'No'],
    ], 3);

    // Future placeholders
    const doc = this.doc;
    this.checkPageBreak(20);
    this.setFillColor(COLORS.surface);
    doc.roundedRect(PAGE.marginLeft, this.y, PAGE.contentWidth, 14, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.textTertiary);
    doc.text('Field Boundary Map • Mission Route • Drone Flight Path — Available in future release', PAGE.marginLeft + 6, this.y + 8);
    this.y += 18;
  }

  // ─── Operational Summary Section ──────────────────────────────────────────

  addOperationalSummary() {
    const m = this.data.mission;
    const p = this.data.pilot;
    const a = this.data.aircraft;
    const b = this.data.battery;

    this.addSectionTitle('Operational Summary');
    this.addDataGrid([
      ['Pilot Flight Hours', p?.total_flight_hours ? `${Number(p.total_flight_hours).toFixed(1)} hrs` : null],
      ['Aircraft Flight Hours', a?.flight_hours ? `${Number(a.flight_hours).toFixed(1)} hrs` : null],
      ['Battery Charge Used', m?.actual_battery_used ? `${m.actual_battery_used}%` : null],
      ['Battery Health', b?.health || 'Good'],
      ['Battery Cycles', b?.cycles != null ? String(b.cycles) : null],
      ['Area Sprayed', m?.actual_area ? `${m.actual_area} ha` : null],
      ['Mission Duration', m?.actual_duration ? `${m.actual_duration} min` : null],
      ['Mission Success', m?.status === 'Completed' ? 'Yes ✓' : 'No'],
    ], 4);

    // Future placeholders
    const doc = this.doc;
    this.checkPageBreak(12);
    this.setFillColor(COLORS.surface);
    doc.roundedRect(PAGE.marginLeft, this.y, PAGE.contentWidth, 10, 2, 2, 'F');
    doc.setFontSize(6.5);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.textTertiary);
    doc.text('Average Flight Speed • Average Altitude — Available in future release', PAGE.marginLeft + 6, this.y + 6);
    this.y += 14;
  }

  // ─── Mission Certification Section ────────────────────────────────────────

  addCertification() {
    this.checkPageBreak(50);
    const doc = this.doc;
    const m = this.data.mission;
    const gen = this.data.generated;

    // Certification box
    const boxY = this.y;
    const boxHeight = 44;

    // Outer border with green accent
    this.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.8);
    doc.roundedRect(PAGE.marginLeft, boxY, PAGE.contentWidth, boxHeight, 3, 3, 'D');

    // Inner fill
    this.setFillColor([250, 255, 250]); // very light green tint
    doc.roundedRect(PAGE.marginLeft + 0.5, boxY + 0.5, PAGE.contentWidth - 1, boxHeight - 1, 2.5, 2.5, 'F');

    // Title
    doc.setFontSize(10);
    doc.setFont(FONTS.heading, 'bold');
    this.setColor(COLORS.secondary);
    doc.text('MISSION CERTIFICATION', PAGE.width / 2, boxY + 9, { align: 'center' });

    // Status line
    doc.setFontSize(9);
    doc.setFont(FONTS.body, 'bold');
    this.setColor(COLORS.primary);
    const statusText = m?.status === 'Completed' ? '✓  COMPLETED SUCCESSFULLY' : `STATUS: ${(m?.status || 'Unknown').toUpperCase()}`;
    doc.text(statusText, PAGE.width / 2, boxY + 17, { align: 'center' });

    // Divider
    this.setDrawColor(COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginLeft + 20, boxY + 21, PAGE.width - PAGE.marginRight - 20, boxY + 21);

    // Generated by
    doc.setFontSize(7);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.textSecondary);
    doc.text('Generated by', PAGE.marginLeft + 10, boxY + 27);
    doc.text('Generation Date', PAGE.width / 2, boxY + 27, { align: 'center' });
    doc.text('Generation Time', PAGE.width - PAGE.marginRight - 10, boxY + 27, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont(FONTS.body, 'bold');
    this.setColor(COLORS.text);
    doc.text('FlyBy by Feldrix', PAGE.marginLeft + 10, boxY + 32);
    doc.text(formatDate(gen?.generated_at), PAGE.width / 2, boxY + 32, { align: 'center' });
    doc.text(formatTime(gen?.generated_at), PAGE.width - PAGE.marginRight - 10, boxY + 32, { align: 'right' });

    // Bottom note
    doc.setFontSize(6);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.textTertiary);
    doc.text('This report was automatically generated by the FlyBy Operations Platform.', PAGE.width / 2, boxY + 40, { align: 'center' });

    this.y = boxY + boxHeight + 8;
  }

  // ─── Footer ───────────────────────────────────────────────────────────────

  addFooter() {
    const doc = this.doc;
    const footerY = PAGE.height - 12;

    // Divider line
    this.setDrawColor(COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginLeft, footerY - 2, PAGE.width - PAGE.marginRight, footerY - 2);

    // Left — FlyBy branding
    doc.setFontSize(6.5);
    doc.setFont(FONTS.body, 'bold');
    this.setColor(COLORS.textSecondary);
    doc.text('FlyBy by Feldrix — Smart Drone Operations', PAGE.marginLeft, footerY + 2);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.textTertiary);
    doc.text('www.feldrix.com', PAGE.marginLeft, footerY + 6);

    // Center — version
    doc.setFontSize(6);
    this.setColor(COLORS.textTertiary);
    doc.text(`Report v${this.data.generated?.version || '1.0'}`, PAGE.width / 2, footerY + 2, { align: 'center' });
    doc.text(formatDate(this.data.generated?.generated_at), PAGE.width / 2, footerY + 6, { align: 'center' });

    // Right — page number (placeholder, will be filled in finalize)
    doc.setFontSize(7);
    doc.setFont(FONTS.body, 'normal');
    this.setColor(COLORS.textSecondary);
    doc.text(`Page ${this.pageNum}`, PAGE.width - PAGE.marginRight, footerY + 4, { align: 'right' });
  }

  // ─── Build Full Report ────────────────────────────────────────────────────

  build() {
    this.addHeader();
    this.addMissionInformation();
    this.addCustomerInformation();
    this.addWeatherSnapshot();
    this.addTimeline();
    this.addFieldInformation();
    this.addOperationalSummary();
    this.addCertification();
    this.addFooter();
    return this.doc;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a PDF Blob from report data.
 */
export async function generatePDFBlob(reportData) {
  await loadLogo();
  const builder = new ReportPDFBuilder(reportData);
  const doc = builder.build();
  return doc.output('blob');
}

/**
 * Download report as PDF file.
 */
export async function downloadPDF(reportData, filename) {
  await loadLogo();
  const builder = new ReportPDFBuilder(reportData);
  const doc = builder.build();
  const defaultFilename = filename || `${reportData.generated?.report_number || 'report'}_${reportData.mission?.mission_number || 'mission'}.pdf`;
  doc.save(defaultFilename);
}

/**
 * Open report in new window for printing.
 */
export async function printReport(reportData) {
  await loadLogo();
  const builder = new ReportPDFBuilder(reportData);
  const doc = builder.build();
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}

/**
 * Generate a data URL for inline preview.
 */
export async function generatePDFDataUrl(reportData) {
  await loadLogo();
  const builder = new ReportPDFBuilder(reportData);
  const doc = builder.build();
  return doc.output('dataurlstring');
}
