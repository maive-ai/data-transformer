import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function convertCsvToExcel(csvContent: string, fileName: string): Promise<Blob> {
  // Parse CSV content
  const rows = csvContent.split('\n').map(row => row.split(','))
  const headers = rows[0]
  const data = rows.slice(1).map(row => {
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header] = row[index] || ''
    })
    return obj
  })

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
