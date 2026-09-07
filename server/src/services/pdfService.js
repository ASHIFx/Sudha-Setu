import PDFDocument from 'pdfkit';

/**
 * Colour-coded triage badge config.
 * pdfkit colour values must be hex strings, not CSS colour names.
 */
const DANGER_BADGE = {
  high:   { label: 'RED — EMERGENCY',  bg: '#DC2626', fg: '#FFFFFF' },
  medium: { label: 'YELLOW — CAUTION', bg: '#D97706', fg: '#FFFFFF' },
  low:    { label: 'GREEN — LOW RISK', bg: '#16A34A', fg: '#FFFFFF' },
};

/* ── tiny layout helpers ─────────────────────────────────────────── */

const PAGE_MARGIN = 50;
const INNER_WIDTH = 595.28 - PAGE_MARGIN * 2; // A4 width minus margins

const hr = (doc, y) => {
  doc.strokeColor('#CBD5E1').lineWidth(0.5)
     .moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + INNER_WIDTH, y).stroke();
};

const sectionTitle = (doc, title) => {
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1E293B').text(title);
  doc.moveDown(0.25);
  doc.font('Helvetica').fontSize(10).fillColor('#334155');
};

const fieldLine = (doc, label, value) => {
  if (!value && value !== 0) return;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#475569')
     .text(`${label}: `, { continued: true })
     .font('Helvetica').fillColor('#1E293B')
     .text(String(value));
};

/* ── main generator ──────────────────────────────────────────────── */

/**
 * Builds a single-page Ayush-format PDF for a populated CaseSheet document.
 *
 * @param {import('mongoose').Document} caseSheet  – populated with patientId + assignedDoctorId
 * @param {object} [userPayload]                  – optional extra patient data
 * @returns {import('pdfkit')} a PDFDocument stream (call `.end()` to finalize)
 */
export const generateCaseSheetPDF = (caseSheet, userPayload = {}) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: PAGE_MARGIN, right: PAGE_MARGIN },
    info: {
      Title: `Sudha Setu Case Sheet — ${caseSheet._id}`,
      Author: 'Sudha Setu (Ministry of Ayush)',
    },
  });

  /* ── Header ────────────────────────────────────────────────────── */
  doc.rect(0, 0, 595.28, 70).fill('#0F172A');
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF')
     .text('Sudha Setu — Ayush Case Sheet', PAGE_MARGIN, 20, { width: INNER_WIDTH });
  doc.fontSize(9).fillColor('#94A3B8')
     .text(`Case ID: ${caseSheet._id}   |   Generated: ${new Date().toLocaleString('en-IN')}`,
           PAGE_MARGIN, 45, { width: INNER_WIDTH });

  doc.y = 85;

  /* ── Triage Badge ──────────────────────────────────────────────── */
  const badge = DANGER_BADGE[caseSheet.dangerLevel] ?? DANGER_BADGE.medium;
  const badgeY = doc.y;
  doc.roundedRect(PAGE_MARGIN, badgeY, 200, 26, 4).fill(badge.bg);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(badge.fg)
     .text(badge.label, PAGE_MARGIN + 12, badgeY + 6, { width: 180 });

  // Confidence beside the badge
  doc.font('Helvetica').fontSize(9).fillColor('#64748B')
     .text(`Confidence: ${Math.round((caseSheet.confidenceScore ?? 0) * 100)}%`,
           PAGE_MARGIN + 220, badgeY + 8);
  doc.y = badgeY + 36;

  hr(doc, doc.y);

  /* ── Patient Demographics ──────────────────────────────────────── */
  const patient = caseSheet.patientId ?? {};
  sectionTitle(doc, 'Patient Demographics');
  fieldLine(doc, 'Name',    patient.name ?? userPayload.name ?? '—');
  fieldLine(doc, 'Email',   patient.email ?? userPayload.email ?? '—');
  fieldLine(doc, 'Phone',   patient.phone ?? userPayload.phone ?? '—');
  fieldLine(doc, 'ABHA ID', patient.abhaId ?? userPayload.abhaId ?? '—');
  fieldLine(doc, 'Language', caseSheet.languageUsed ?? 'auto');

  hr(doc, doc.y + 6);

  /* ── Chief Complaints / Dialogue ───────────────────────────────── */
  sectionTitle(doc, 'Chief Complaints');
  const dialogue = caseSheet.rawDialogue ?? [];
  if (dialogue.length > 0) {
    const patientMessages = dialogue
      .filter((t) => t.sender === 'patient')
      .map((t) => t.message);
    doc.text(patientMessages.join('\n') || '—', { indent: 10 });
  } else {
    doc.text('—');
  }

  /* ── Symptoms ──────────────────────────────────────────────────── */
  if (caseSheet.symptoms?.length > 0) {
    sectionTitle(doc, 'Symptoms');
    for (const s of caseSheet.symptoms) {
      const severity = s.severity ? `  [severity: ${s.severity}/10]` : '';
      const duration = s.duration ? `  (${s.duration})` : '';
      doc.text(`• ${s.name}${duration}${severity}`, { indent: 10 });
    }
  }

  hr(doc, doc.y + 6);

  /* ── Ayurvedic Parameters ──────────────────────────────────────── */
  const markers = caseSheet.ayurvedicMarkers ?? {};
  sectionTitle(doc, 'Ayurvedic Parameters');
  fieldLine(doc, 'Prakriti', markers.suspectedPrakriti ?? 'unknown');
  fieldLine(doc, 'Agni',    markers.agniStatus ?? 'unknown');
  fieldLine(doc, 'Diet',    markers.dietHabits);
  fieldLine(doc, 'Sleep',   markers.sleepPattern);

  hr(doc, doc.y + 6);

  /* ── Doctor Notes ──────────────────────────────────────────────── */
  sectionTitle(doc, 'Doctor Notes');
  doc.text(caseSheet.doctorNotes || 'No notes recorded.', { indent: 10 });

  if (caseSheet.assignedDoctorId) {
    const dr = caseSheet.assignedDoctorId;
    fieldLine(doc, 'Assigned Doctor', typeof dr === 'object' ? dr.name : String(dr));
  }

  hr(doc, doc.y + 6);

  /* ── Prescription ──────────────────────────────────────────────── */
  sectionTitle(doc, 'Prescription');
  if (caseSheet.prescription?.length > 0) {
    for (const [i, rx] of caseSheet.prescription.entries()) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E293B')
         .text(`${i + 1}. ${rx.medicineName}`);
      doc.font('Helvetica').fontSize(9).fillColor('#475569');
      if (rx.dosage) doc.text(`   Dosage: ${rx.dosage}`, { indent: 15 });
      if (rx.timing) doc.text(`   Timing: ${rx.timing}`, { indent: 15 });
      if (rx.duration) doc.text(`   Duration: ${rx.duration}`, { indent: 15 });
      if (rx.instructions) doc.text(`   Instructions: ${rx.instructions}`, { indent: 15 });
      doc.moveDown(0.2);
    }
  } else {
    doc.text('No prescription issued.', { indent: 10 });
  }

  /* ── Footer ────────────────────────────────────────────────────── */
  doc.moveDown(1);
  hr(doc, doc.y);
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(7).fillColor('#94A3B8')
     .text(
       'This document is generated by Sudha Setu (SIH26047 — Ministry of Ayush). ' +
       'It is not a substitute for an in-person medical examination.',
       PAGE_MARGIN,
       doc.y,
       { width: INNER_WIDTH, align: 'center' }
     );

  return doc;
};
