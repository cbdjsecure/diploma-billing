import XLSX from 'xlsx';
import db from './database.js';

const EXCEL_PATH = 'C:/Users/SASWATA/.gemini/antigravity/brain/b197505e-8250-486d-9997-1e9bf0910038/.user_uploaded/media_1794120893955_f796a884.xlsx';

export function importCentresFromExcel(filePath = EXCEL_PATH) {
  console.log(`Loading centres Excel workbook from: ${filePath}...`);
  const workbook = XLSX.readFile(filePath);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO centres (
      short_code, centre_code, centre_name, principal,
      phone1, phone2, address, email, whatsapp, full_address,
      created_by, checked_by, sheet_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalImported = 0;

  const insertMany = db.transaction((rows) => {
    for (const r of rows) {
      insert.run(
        r.short_code, r.centre_code, r.centre_name, r.principal,
        r.phone1, r.phone2, r.address, r.email, r.whatsapp, r.full_address,
        r.created_by, r.checked_by, r.sheet_type
      );
    }
  });

  for (const sheetName of workbook.SheetNames) {
    console.log(`Processing sheet: ${sheetName}...`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!data || data.length < 2) continue;

    const rowsToInsert = [];

    if (sheetName === 'CENTRE & R CENTRE' || sheetName === 'Previous R Centre' || sheetName === 'International') {
      // Header row: Short Code(0), Centre Code(1), Centre Name(2), Principal(3), Phone1(4), Phone2(5), Address(6), Email(7), WhatsApp(8), Full Address(9), By(10), Checked By(11)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue; // Needs at least short code or row identifier

        const short_code = String(row[0] || '').trim();
        if (!short_code) continue;

        rowsToInsert.push({
          short_code,
          centre_code: row[1] ? String(row[1]).trim() : null,
          centre_name: row[2] ? String(row[2]).trim() : null,
          principal: row[3] ? String(row[3]).trim() : null,
          phone1: row[4] ? String(row[4]).trim() : null,
          phone2: row[5] ? String(row[5]).trim() : null,
          address: row[6] ? String(row[6]).trim() : null,
          email: row[7] ? String(row[7]).trim() : null,
          whatsapp: row[8] ? String(row[8]).trim() : null,
          full_address: row[9] ? String(row[9]).trim() : null,
          created_by: row[10] ? String(row[10]).trim() : null,
          checked_by: row[11] ? String(row[11]).trim() : null,
          sheet_type: sheetName
        });
      }
    } else if (sheetName === 'CF Centre') {
      // CF centres often have CF code in col 0
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;

        const code = String(row[0]).trim();
        rowsToInsert.push({
          short_code: code,
          centre_code: code,
          centre_name: row[1] ? String(row[1]).trim() : null,
          principal: row[2] ? String(row[2]).trim() : null,
          phone1: row[3] ? String(row[3]).trim() : null,
          phone2: row[4] ? String(row[4]).trim() : null,
          address: row[5] ? String(row[5]).trim() : null,
          email: row[6] ? String(row[6]).trim() : null,
          whatsapp: null,
          full_address: row[5] ? String(row[5]).trim() : null,
          created_by: null,
          checked_by: null,
          sheet_type: sheetName
        });
      }
    }

    if (rowsToInsert.length > 0) {
      insertMany(rowsToInsert);
      totalImported += rowsToInsert.length;
      console.log(`Imported ${rowsToInsert.length} records from ${sheetName}`);
    }
  }

  console.log(`Total centres imported: ${totalImported}`);
  return totalImported;
}

if (process.argv[1] && process.argv[1].endsWith('import-centres.js')) {
  importCentresFromExcel();
}

