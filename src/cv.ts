// Punto de entrada tipado del CV. Los datos se editan en `cv.json` (inglés) y
// `cv.es.json` (español); este módulo los valida contra el tipo `CV` para que
// `astro check` detecte errores de forma.
import cvEnData from "../cv.json"
import cvEsData from "../cv.es.json"
import type { CV } from "@/types/cv"
import type { Lang } from "@/i18n/ui"

export const cvEn: CV = cvEnData
export const cvEs: CV = cvEsData

/** CV por idioma; el español es el idioma por defecto del sitio. */
export const cvs: Record<Lang, CV> = { es: cvEs, en: cvEn }
