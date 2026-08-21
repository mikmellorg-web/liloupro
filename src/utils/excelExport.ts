import * as XLSX from 'xlsx';

export function exportJsonToExcel(data: any[], fileName: string, sheetName = 'Planilha') {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
  }
}
