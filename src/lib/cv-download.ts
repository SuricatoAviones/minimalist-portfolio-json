import { basics } from "@cv"
import { cvFilename } from "@/lib/cv-filename"

/** Ruta pública del CV en PDF (generado por `src/pages/cv.pdf.ts`). */
export const CV_PDF_URL = "/cv.pdf"

/**
 * Nombre de archivo recomendado para ATS y reclutadores: `Nombre-Apellidos-CV.pdf`,
 * sin tildes, espacios ni caracteres especiales.
 */
export const CV_PDF_FILENAME = cvFilename(basics.name)
