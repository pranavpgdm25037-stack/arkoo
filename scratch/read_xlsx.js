import xlsx from 'xlsx';
import fs from 'fs';

const workbook = xlsx.readFile('PIF-1831-Rishi Vashi - R0.xlsx');
console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach((sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  const csv = xlsx.utils.sheet_to_csv(sheet);
  fs.writeFileSync(`scratch/sheet_${sheetName.replace(/\s+/g, '_')}.csv`, csv);
  console.log(`Saved sheet ${sheetName}`);
});
