import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * EXACT REPLICA OF THE SURO BHARATI BILL TEMPLATE IN PDF
 * Including:
 * 1. Official Logo (top left)
 * 2. Header: Suro Bharati Sangeet Kala Kendra
 * 3. Subtitle & Session: 19/I Vivekananda Lane , Serampore , Hooghly - 712201   Session 2026-27
 * 4. Institute details (Name of Institute -, Principal -, Address -)
 * 5. Data table: Year | Exam Fees | Old Examinee | New Examinee | Total Amount
 * 6. Bottom ledger:
 *    - Total--
 *    - Special Less X% + Extra Less Y%
 *    - Fees After Deduction
 *    - Rs- 23/- Registration Fees (For Each New Examinee)
 *    - Convocation Fees (Calculated per qualifying milestone)
 *    - Less: [Examiner fees] (if applicable)
 *    - Boxed: [Total Examinee-- N] [Total Payable Exam Fees-- Rs. X]
 */
export function generateBillPDF(bill) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Add Logo if available
  try {
    const logoImg = new Image();
    logoImg.src = '/logo.png';
    doc.addImage(logoImg, 'PNG', 14, 10, 22, 22);
  } catch (e) {
    // fallback if image not loaded
  }

  // Top Date (Row 1)
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(bill.bill_date || new Date().toISOString().split('T')[0], 14, 8);

  // Main Header: Suro Bharati Sangeet Kala Kendra (Row 2-3)
  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(0, 0, 0);
  doc.text('Suro Bharati Sangeet Kala Kendra', (pageWidth / 2) + 6, 17, { align: 'center' });

  // Address & Session Subtitle (Row 4-5)
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text(
    `19/I Vivekananda Lane , Serampore , Hooghly - 712201                  Session ${bill.session || '2026-27'}`,
    (pageWidth / 2) + 6,
    23,
    { align: 'center' }
  );

  // Meta Section (Rows 6-8)
  let y = 35;
  doc.setFontSize(10.5);

  // Row 6: Name of Institute
  doc.setFont('times', 'bold');
  doc.text('Name of Institute - ', 14, y);
  doc.text(bill.centre_name || '', 52, y);

  if (bill.centre_short_code) {
    doc.text(`(Code: ${bill.centre_short_code})`, pageWidth - 14, y, { align: 'right' });
  }

  // Row 7: Principal
  y += 6;
  doc.setFont('times', 'bold');
  doc.text('Principal - ', 14, y);
  doc.setFont('times', 'normal');
  doc.text(bill.principal || '', 52, y);

  // Row 8: Address
  y += 6;
  doc.setFont('times', 'bold');
  doc.text('Address - ', 14, y);
  doc.setFont('times', 'normal');
  const splitAddr = doc.splitTextToSize(bill.address || '', pageWidth - 66);
  doc.text(splitAddr, 52, y);

  y += (splitAddr.length * 5) + 3;

  // Table Data (Rows 10..N)
  const tableRows = (bill.items || []).map((item) => {
    const oldCount = parseInt(item.old_count) || 0;
    const newCount = parseInt(item.new_count) || 0;
    return [
      item.level_name,
      item.exam_fee,
      oldCount > 0 ? String(oldCount) : '0',
      newCount > 0 ? String(newCount) : '0',
      item.line_total.toFixed(0)
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Year', 'Exam Fees', 'Old Examinee ', 'New Examinee', 'Total Amount']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 10,
      textColor: [0, 0, 0],
      halign: 'center',
      cellPadding: 2
    },
    bodyStyles: {
      font: 'times',
      fontSize: 10,
      textColor: [0, 0, 0],
      halign: 'center',
      cellPadding: 1.8
    },
    columnStyles: {
      0: { cellWidth: 55, halign: 'left' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 32, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  let currentY = doc.lastAutoTable.finalY;

  // Bottom Breakdown Section (matching template rows 22-27)
  const breakdownRows = [];

  // Row 22: Total--
  breakdownRows.push([
    { content: 'Total--', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: String(bill.total_old || 0), styles: { halign: 'center', fontStyle: 'bold' } },
    { content: String(bill.total_new || 0), styles: { halign: 'center', fontStyle: 'bold' } },
    { content: bill.gross_fees.toFixed(0), styles: { halign: 'center', fontStyle: 'bold' } }
  ]);

  // Row 23: Discount
  if (bill.total_discount_percent > 0) {
    let discText = `Special Less ${bill.slab_discount_percent}%`;
    if (bill.seasonal_discount_percent > 0) {
      discText += ` + Extra Less ${bill.seasonal_discount_percent}%`;
    }
    breakdownRows.push([
      { content: discText, colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: bill.discount_amount.toFixed(1), styles: { halign: 'center' } }
    ]);

    // Row 24: Fees After Deduction
    breakdownRows.push([
      { content: 'Fees After Deduction', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: bill.fees_after_discount.toFixed(1), styles: { halign: 'center' } }
    ]);
  }

  // Row 25: Registration Fees
  breakdownRows.push([
    {
      content: 'Rs- 23/- Registration Fees (For Each New Examinee)',
      colSpan: 4,
      styles: { halign: 'center', fontStyle: 'bold' }
    },
    { content: bill.registration_fees.toFixed(0), styles: { halign: 'center' } }
  ]);

  // Row 26: Convocation Fees (EXACT formula result)
  if (bill.convocation_fees > 0) {
    breakdownRows.push([
      { content: 'Convocation Fees', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: bill.convocation_fees.toFixed(0), styles: { halign: 'center' } }
    ]);
  }

  // Examiner fee deduction (if any)
  if (bill.examiner_fee_amount > 0) {
    breakdownRows.push([
      {
        content: `Less: ${bill.examiner_fee_note || 'Examiner Fees'}`,
        colSpan: 4,
        styles: { halign: 'center', fontStyle: 'bold' }
      },
      { content: `-${bill.examiner_fee_amount.toFixed(0)}`, styles: { halign: 'center' } }
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    body: breakdownRows,
    theme: 'plain',
    styles: {
      font: 'times',
      fontSize: 10,
      textColor: [0, 0, 0],
      cellPadding: 1.8
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { cellWidth: 32 }
    },
    margin: { left: 14, right: 14 }
  });

  const finalBoxY = doc.lastAutoTable.finalY + 3;

  // Row 27: The Bordered Final Box
  // [Total Examinee--  COUNT] [Total Payable Exam Fees--   AMOUNT]
  autoTable(doc, {
    startY: finalBoxY,
    body: [
      [
        { content: 'Total Examinee--', styles: { halign: 'left', fontStyle: 'bold', fontSize: 10.5 } },
        { content: String(bill.total_examinees || 0), styles: { halign: 'left', fontStyle: 'bold', fontSize: 11 } },
        { content: 'Total Payable Exam Fees--', styles: { halign: 'center', fontStyle: 'bold', fontSize: 10.5 } },
        { content: `Rs. ${bill.total_payable.toFixed(1)}`, styles: { halign: 'center', fontStyle: 'bold', fontSize: 12 } }
      ]
    ],
    theme: 'grid',
    styles: {
      font: 'times',
      lineColor: [0, 0, 0],
      lineWidth: 0.6,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 25 },
      2: { cellWidth: 62 },
      3: { cellWidth: 58 }
    },
    margin: { left: 14, right: 14 }
  });

  return doc;
}
