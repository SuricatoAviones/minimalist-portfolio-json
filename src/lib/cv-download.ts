import { basics } from "@cv"

/** Ruta pública del CV en PDF (generado por `src/pages/cv.pdf.ts`). */
export const CV_PDF_URL = "/cv.pdf"

/**
 * Nombre de archivo recomendado para ATS y reclutadores: `Nombre-Apellidos-CV.pdf`,
 * sin tildes, espacios ni caracteres especiales.
 */
export const CV_PDF_FILENAME = `${basics.name
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^a-zA-Z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")}-CV.pdf`
