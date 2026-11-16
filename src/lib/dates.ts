import type { DateString } from "@/types/cv"

// Se parsea el texto en lugar de usar `new Date()` para evitar desfases de zona horaria
// (p. ej. "2021-01-01" se convertiría en 2020 en husos horarios negativos).
function parseDate(date: DateString) {
  const [year, month] = date.split("-")
  return { year, month }
}

export function getYear(date: DateString) {
  return parseDate(date).year
}

/** Formato `MM/YYYY`, el más fiable para los parsers ATS. */
export function formatMonthYear(date: DateString) {
  const { year, month } = parseDate(date)
  return month ? `${month.padStart(2, "0")}/${year}` : year
}

export function formatYearRange(startDate: DateString, endDate?: DateString | null, present = "Present") {
  return `${getYear(startDate)} - ${endDate ? getYear(endDate) : present}`
}

export function formatMonthYearRange(startDate: DateString, endDate?: DateString | null, present = "Present") {
  return `${formatMonthYear(startDate)} - ${endDate ? formatMonthYear(endDate) : present}`
}
