import type { CV, DateString } from "@/types/cv"
import { formatMonthYear, formatMonthYearRange } from "@/lib/dates"

/*
 * Modelo intermedio del CV: traduce `cv.json` a una lista de secciones y bloques
 * independiente del motor que los dibuja. Lo consumen tanto el PDF de /cv.pdf
 * (PDFKit, en el build) como el PDF que genera el navegador al subir un JSON,
 * de modo que ambos documentos comparten el mismo orden, textos y formato.
 */

export interface Segment {
  text: string
  link?: string
  bold?: boolean
}

export interface CvEntry {
  title: Segment[]
  subtitle?: string
  summary?: string
  highlights?: string[]
  notes?: Segment[]
}

export type CvBlock =
  | { type: "paragraph"; segments: Segment[]; spaceBefore?: number }
  | { type: "entries"; entries: CvEntry[] }

export interface CvSection {
  title: string
  blocks: CvBlock[]
}

export interface CvContent {
  name: string
  label: string
  /** Líneas de contacto y enlaces, ya separadas con ` | `. */
  lines: Segment[][]
  sections: CvSection[]
}

/** Separador de datos en una misma línea, el más legible para los ATS. */
export const SEPARATOR = " | "

const stripProtocol = (url: string) => url.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")

// Certificados, premios y publicaciones pueden no tener fecha (es opcional en JSON Resume).
const formatOptionalDate = (date?: DateString) => (date ? formatMonthYear(date) : "")

const linkSegments = (url?: string): Segment[] => (url ? [{ text: stripProtocol(url), link: url }] : [])

const unique = (values: string[]) => {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = value.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const joinSegments = (segments: Segment[]) =>
  segments.flatMap((segment, index) => (index === 0 ? [segment] : [{ text: SEPARATOR }, segment]))

const paragraph = (segments: Segment[], spaceBefore?: number): CvBlock => ({
  type: "paragraph",
  segments,
  ...(spaceBefore ? { spaceBefore } : {}),
})

export function buildCvContent(cv: CV): CvContent {
  const { basics, work, volunteer, education, awards, certificates, publications, skills, languages, projects } = cv

  const { city, region } = basics.location
  const location = [city, region].filter(Boolean).join(", ")
  const contact: Segment[] = [
    ...(location ? [{ text: location }] : []),
    ...(basics.email ? [{ text: basics.email, link: `mailto:${basics.email}` }] : []),
    ...(basics.phone ? [{ text: basics.phone, link: `tel:${basics.phone.replace(/[^\d+]/g, "")}` }] : []),
  ]
  const links: Segment[] = [...linkSegments(basics.url), ...basics.profiles.flatMap(({ url }) => linkSegments(url))]

  const sections: CvSection[] = []

  if (basics.summary) {
    sections.push({ title: "Perfil profesional", blocks: [paragraph([{ text: basics.summary }])] })
  }

  if (work.length > 0) {
    sections.push({
      title: "Experiencia laboral",
      blocks: [
        {
          type: "entries",
          entries: work.map((job) => ({
            title: [{ text: job.position, bold: true }],
            subtitle: [job.name, job.location, formatMonthYearRange(job.startDate, job.endDate)]
              .filter(Boolean)
              .join(SEPARATOR),
            summary: job.summary,
            highlights: job.highlights,
          })),
        },
      ],
    })
  }

  if (education.length > 0) {
    sections.push({
      title: "Educación",
      blocks: [
        {
          type: "entries",
          entries: education.map((study) => ({
            title: [{ text: study.studyType ? `${study.area} (${study.studyType})` : study.area, bold: true }],
            subtitle: [study.institution, formatMonthYearRange(study.startDate, study.endDate)]
              .filter(Boolean)
              .join(SEPARATOR),
          })),
        },
      ],
    })
  }

  if (skills.length > 0) {
    const technologies = skills.map(({ name }) => name)
    const names = new Set(technologies.map((name) => name.toLowerCase()))
    const competencies = unique(skills.flatMap(({ keywords }) => keywords)).filter(
      (keyword) => !names.has(keyword.toLowerCase())
    )

    const blocks: CvBlock[] = [
      paragraph([{ text: "Tecnologías: ", bold: true }, { text: technologies.join(", ") }]),
    ]
    if (competencies.length > 0) {
      blocks.push(paragraph([{ text: "Competencias: ", bold: true }, { text: competencies.join(", ") }], 0.2))
    }
    sections.push({ title: "Habilidades", blocks })
  }

  if (projects.length > 0) {
    sections.push({
      title: "Proyectos",
      blocks: [
        {
          type: "entries",
          entries: projects.map((project) => ({
            title: joinSegments([
              { text: project.name, bold: true },
              ...linkSegments(project.url),
              ...linkSegments(project.github),
            ]),
            summary: project.description,
            notes: project.highlights.length > 0 ? [{ text: project.highlights.join(SEPARATOR) }] : [],
          })),
        },
      ],
    })
  }

  if (certificates.length > 0) {
    sections.push({
      title: "Certificaciones",
      blocks: [
        {
          type: "entries",
          entries: certificates.map((certificate) => ({
            title: [{ text: certificate.name, bold: true }],
            subtitle: [certificate.issuer, formatOptionalDate(certificate.date)].filter(Boolean).join(SEPARATOR),
            notes: linkSegments(certificate.url),
          })),
        },
      ],
    })
  }

  if (awards.length > 0) {
    sections.push({
      title: "Premios",
      blocks: [
        {
          type: "entries",
          entries: awards.map((award) => ({
            title: [{ text: award.title, bold: true }],
            subtitle: [award.awarder, formatOptionalDate(award.date)].filter(Boolean).join(SEPARATOR),
            summary: award.summary,
          })),
        },
      ],
    })
  }

  if (publications.length > 0) {
    sections.push({
      title: "Publicaciones",
      blocks: [
        {
          type: "entries",
          entries: publications.map((publication) => ({
            title: [{ text: publication.name, bold: true }],
            subtitle: [publication.publisher, formatOptionalDate(publication.releaseDate)]
              .filter(Boolean)
              .join(SEPARATOR),
            summary: publication.summary,
            notes: linkSegments(publication.url),
          })),
        },
      ],
    })
  }

  if (volunteer.length > 0) {
    sections.push({
      title: "Voluntariado",
      blocks: [
        {
          type: "entries",
          entries: volunteer.map((item) => ({
            title: [{ text: item.position, bold: true }],
            subtitle: [item.organization, formatMonthYearRange(item.startDate, item.endDate)].join(SEPARATOR),
            summary: item.summary,
            highlights: item.highlights,
          })),
        },
      ],
    })
  }

  if (languages.length > 0) {
    sections.push({
      title: "Idiomas",
      blocks: languages.map(({ language, fluency }) => paragraph([{ text: `${language}: `, bold: true }, { text: fluency }])),
    })
  }

  return {
    name: basics.name,
    label: basics.label,
    lines: [contact, links].filter((line) => line.length > 0).map(joinSegments),
    sections,
  }
}
