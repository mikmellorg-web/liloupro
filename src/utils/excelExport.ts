/**
 * Simple, zero-dependency Excel/Spreadsheet exporter compatible with Microsoft Excel,
 * Google Sheets, LibreOffice, and Numbers.
 */

function escapeXml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return '';
  const str = String(unsafe);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportJsonToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Planilha'
): void {
  if (!data || data.length === 0) {
    console.warn('Nenhum dado fornecido para exportação.');
    return;
  }

  const headers = Object.keys(data[0]);

  // Construct Excel XML (SpreadsheetML / XML Spreadsheet 2003)
  // This opens natively in Excel and Google Sheets preserving columns, accents (UTF-8), and formatting.
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" />
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid" />
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1" />
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center" ss:WrapText="1" />
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table>
`;

  // Define columns
  headers.forEach(h => {
    const maxLen = Math.max(h.length, ...data.map(d => String(d[h] || '').length));
    const width = Math.min(Math.max(maxLen * 8 + 20, 80), 300);
    xml += `   <Column ss:AutoFitWidth="1" ss:Width="${width}" />\n`;
  });

  // Header row
  xml += '   <Row ss:StyleID="Header">\n';
  headers.forEach(header => {
    xml += `    <Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
  });
  xml += '   </Row>\n';

  // Data rows
  data.forEach(row => {
    xml += '   <Row ss:StyleID="DataCell">\n';
    headers.forEach(header => {
      const val = row[header];
      const isNum = typeof val === 'number' && !isNaN(val);
      const type = isNum ? 'Number' : 'String';
      const cellVal = isNum ? val : escapeXml(val);
      xml += `    <Cell><Data ss:Type="${type}">${cellVal}</Data></Cell>\n`;
    });
    xml += '   </Row>\n';
  });

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Ensure appropriate extension
  const safeFilename = filename.endsWith('.xls') || filename.endsWith('.xlsx')
    ? filename.replace(/\.xlsx$/i, '.xls')
    : `${filename}.xls`;

  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
