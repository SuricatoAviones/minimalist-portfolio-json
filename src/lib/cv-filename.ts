/** Nombre de archivo recomendado para ATS y reclutadores: `Nombre-Apellidos-CV.pdf`. */
export function cvFilename(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `${slug || "CV"}-CV.pdf`
}
