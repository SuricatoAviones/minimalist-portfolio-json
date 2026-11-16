import type { Lang } from "@/i18n/ui"
import { cvFilename } from "@/lib/cv-filename"

/** Ruta pública del CV en PDF según el idioma (`src/pages/cv.pdf.ts` y `src/pages/en/cv.pdf.ts`). */
export const cvPdfPath = (lang: Lang) => (lang === "en" ? "/en/cv.pdf" : "/cv.pdf")

/**
 * Nombre de archivo recomendado para ATS y reclutadores: `Nombre-Apellidos-CV.pdf`,
 * sin tildes, espacios ni caracteres especiales.
 */
export const cvPdfFilename = (name: string) => cvFilename(name)
