import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'
import { RunState } from "@/types/enums"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getNodeBorderClass(runState?: RunState): string {
  switch (runState) {
    case RunState.IDLE: return "border border-gray-200";
    case RunState.RUNNING: return "rainbow-outline";
    case RunState.DONE: return "green-outline";
    case RunState.ERROR: return "border-2 border-red-500";
    case RunState.PROMPT: return "border-2 border-blue-400 animate-pulse";
    default: return "border border-gray-200";
  }
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
