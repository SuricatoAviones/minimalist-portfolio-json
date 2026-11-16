/*
 * Tokens visuales del CV en PDF. Los comparten el generador del build
 * (`cv-pdf.ts`, PDFKit) y el del navegador (`cv-pdf-browser.ts`, pdf-lib),
 * para que ambos documentos tengan el mismo aspecto.
 *
 * Se usan fuentes estándar de PDF (Helvetica) por compatibilidad con los ATS.
 */
export const PDF_FONT = { regular: "Helvetica", bold: "Helvetica-Bold" } as const

export const PDF_SIZE = { name: 20, label: 11.5, heading: 11, title: 10.5, body: 10, meta: 9.5 } as const

export const PDF_COLOR = { text: "#111111", muted: "#444444", rule: "#8c8c8c" } as const

/** A4 en puntos PostScript. */
export const PDF_PAGE = { width: 595.28, height: 841.89 } as const

export const PDF_MARGIN = 50
export const PDF_LINE_GAP = 2
export const PDF_BULLET_INDENT = 12
