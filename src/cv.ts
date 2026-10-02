// Punto de entrada tipado del CV. Los datos se editan en `cv.json` (raíz del proyecto);
// este módulo los valida contra el tipo `CV` para que `astro check` detecte errores de forma.
import data from "../cv.json"
import type { CV } from "@/types/cv"

export const cv: CV = data

export const {
  basics,
  work,
  volunteer,
  education,
  awards,
  certificates,
  publications,
  skills,
  languages,
  interests,
  references,
  projects,
} = cv

export default cv
