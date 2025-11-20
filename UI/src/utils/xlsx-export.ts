import * as XLSX from "xlsx";

/** Xuất mảng object ra file .xlsx (mỗi lần 1 sheet đơn giản) */
export function exportToXlsx(filename: string, sheetName: string, data: any[]) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}