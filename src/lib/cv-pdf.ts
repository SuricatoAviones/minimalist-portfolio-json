import PDFDocument from "pdfkit"
import type { CV, DateString } from "@/types/cv"
import { formatMonthYear, formatMonthYearRange } from "@/lib/dates"

/*
 * Generador del CV en PDF optimizado para ATS (Applicant Tracking Systems):
 * - Una sola columna y orden de lectura lineal: sin tablas, cuadros de texto, iconos ni imágenes.
 * - Fuente estándar (Helvetica) con codificación WinAnsi: el texto es seleccionable y extraíble.
 * - Encabezados de sección estándar ("Experiencia laboral", "Educación", "Habilidades"...).
 * - Datos de contacto en el cuerpo del documento (no en cabeceras ni pies de página).
 * - Fechas en formato MM/YYYY y URLs escritas completas en texto plano.
 * - PDF etiquetado (tagged) con idioma y metadatos (título, autor, asunto y palabras clave).
 */

type Doc = PDFKit.PDFDocument
type Struct = PDFKit.PDFStructureElement

interface Segment {
  text: string
  link?: string
  bold?: boolean
}

interface Entry {
  title: Segment[]
  subtitle?: string
  summary?: string
  highlights?: string[]
  notes?: Segment[]
}

const FONT = { regular: "Helvetica", bold: "Helvetica-Bold" }
const SIZE = { name: 20, label: 11.5, heading: 11, title: 10.5, body: 10, meta: 9.5 }
const COLOR = { text: "#111111", muted: "#444444", rule: "#8c8c8c" }
const MARGIN = 50
const LINE_GAP = 2
const BULLET_INDENT = 12

const SEPARATOR = " | "

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

function contentWidth(doc: Doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right
}

/** Salta de página si no cabe el bloque, para no dejar títulos huérfanos al final de una hoja. */
function ensureSpace(doc: Doc, height: number) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage()
}

/** Párrafo con fragmentos en línea; los enlaces se etiquetan como `Link` para lectores de pantalla. */
function inline(
  doc: Doc,
  parent: Struct,
  tag: string,
  segments: Segment[],
  { size = SIZE.body, color = COLOR.text } = {}
) {
  const children = segments.map(({ text, link, bold }, index) => {
    const continued = index < segments.length - 1
    const write = () => {
      doc
        .font(bold ? FONT.bold : FONT.regular)
        .fontSize(size)
        .fillColor(color)
        .text(text, { link: link ?? null, continued, lineGap: LINE_GAP })
    }
    return link ? doc.struct("Link", {}, write) : write
  })

  parent.add(doc.struct(tag, {}, children))
}

function paragraph(doc: Doc, parent: Struct, text: string, options?: { size?: number; color?: string }) {
  inline(doc, parent, "P", [{ text }], options)
}

function bulletList(doc: Doc, parent: Struct, items: string[]) {
  const list = doc.struct("L")
  parent.add(list)

  const left = doc.page.margins.left
  for (const item of items) {
    ensureSpace(doc, SIZE.body * 2)
    const y = doc.y
    const listItem = doc.struct("LI")
    list.add(listItem)

    listItem.add(
      doc.struct("Lbl", {}, () => {
        doc.font(FONT.regular).fontSize(SIZE.body).fillColor(COLOR.text)
        doc.text("•", left + 2, y, { lineBreak: false })
      })
    )
    listItem.add(
      doc.struct("LBody", {}, () => {
        doc.text(item, left + BULLET_INDENT, y, {
          width: contentWidth(doc) - BULLET_INDENT,
          lineGap: LINE_GAP,
        })
      })
    )
    listItem.end()
  }

  list.end()
  doc.x = left
}

function section(doc: Doc, root: Struct, title: string, render: (sect: Struct) => void) {
  ensureSpace(doc, 80)
  if (doc.y > doc.page.margins.top) doc.moveDown(0.9)

  const sect = doc.struct("Sect")
  root.add(sect)
  sect.add(
    doc.struct("H2", {}, () => {
      doc.font(FONT.bold).fontSize(SIZE.heading).fillColor(COLOR.text).text(title.toUpperCase())
    })
  )

  // La línea divisoria es decorativa: se marca como artefacto para que no forme parte del contenido.
  const y = doc.y + 2
  doc.markContent("Artifact", { type: "Layout" })
  doc
    .save()
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .lineWidth(0.6)
    .strokeColor(COLOR.rule)
    .stroke()
    .restore()
  doc.endMarkedContent()
  doc.y = y + 6

  render(sect)
  sect.end()
}

function entry(doc: Doc, parent: Struct, { title, subtitle, summary, highlights = [], notes = [] }: Entry) {
  ensureSpace(doc, 60)

  const block = doc.struct("Div")
  parent.add(block)

  inline(doc, block, "H3", title, { size: SIZE.title })
  if (subtitle) paragraph(doc, block, subtitle, { size: SIZE.meta, color: COLOR.muted })
  if (summary) {
    doc.moveDown(0.2)
    paragraph(doc, block, summary)
  }
  if (highlights.length > 0) {
    doc.moveDown(0.2)
    bulletList(doc, block, highlights)
  }
  if (notes.length > 0) inline(doc, block, "P", notes, { size: SIZE.meta, color: COLOR.muted })

  block.end()
  doc.moveDown(0.7)
}

function renderCv(doc: Doc, cv: CV) {
  const { basics, work, volunteer, education, awards, certificates, publications, skills, languages, projects } =
    cv

  const root = doc.struct("Document")
  doc.addStructure(root)

  // Cabecera: nombre, titular y contacto en texto plano dentro del cuerpo.
  inline(doc, root, "H1", [{ text: basics.name, bold: true }], { size: SIZE.name })
  doc.moveDown(0.15)
  paragraph(doc, root, basics.label, { size: SIZE.label })
  doc.moveDown(0.3)

  const { city, region } = basics.location
  const location = [city, region].filter(Boolean).join(", ")
  const contact: Segment[] = [
    ...(location ? [{ text: location }] : []),
    ...(basics.email ? [{ text: basics.email, link: `mailto:${basics.email}` }] : []),
    ...(basics.phone ? [{ text: basics.phone, link: `tel:${basics.phone.replace(/[^\d+]/g, "")}` }] : []),
  ]
  const links: Segment[] = [
    ...linkSegments(basics.url),
    ...basics.profiles.flatMap(({ url }) => linkSegments(url)),
  ]
  for (const line of [contact, links]) {
    if (line.length > 0) inline(doc, root, "P", joinSegments(line), { size: SIZE.meta, color: COLOR.muted })
  }

  if (basics.summary) {
    section(doc, root, "Perfil profesional", (sect) => paragraph(doc, sect, basics.summary))
  }

  if (work.length > 0) {
    section(doc, root, "Experiencia laboral", (sect) => {
      for (const job of work) {
        entry(doc, sect, {
          title: [{ text: job.position, bold: true }],
          subtitle: [job.name, job.location, formatMonthYearRange(job.startDate, job.endDate)]
            .filter(Boolean)
            .join(SEPARATOR),
          summary: job.summary,
          highlights: job.highlights,
        })
      }
    })
  }

  if (education.length > 0) {
    section(doc, root, "Educación", (sect) => {
      for (const study of education) {
        entry(doc, sect, {
          title: [{ text: study.studyType ? `${study.area} (${study.studyType})` : study.area, bold: true }],
          subtitle: [study.institution, formatMonthYearRange(study.startDate, study.endDate)].join(SEPARATOR),
        })
      }
    })
  }

  if (skills.length > 0) {
    const technologies = skills.map(({ name }) => name)
    const names = new Set(technologies.map((name) => name.toLowerCase()))
    const competencies = unique(skills.flatMap(({ keywords }) => keywords)).filter(
      (keyword) => !names.has(keyword.toLowerCase())
    )

    section(doc, root, "Habilidades", (sect) => {
      inline(doc, sect, "P", [{ text: "Tecnologías: ", bold: true }, { text: technologies.join(", ") }])
      if (competencies.length > 0) {
        doc.moveDown(0.2)
        inline(doc, sect, "P", [{ text: "Competencias: ", bold: true }, { text: competencies.join(", ") }])
      }
    })
  }

  if (projects.length > 0) {
    section(doc, root, "Proyectos", (sect) => {
      for (const project of projects) {
        entry(doc, sect, {
          title: joinSegments([
            { text: project.name, bold: true },
            ...linkSegments(project.url),
            ...linkSegments(project.github),
          ]),
          summary: project.description,
          notes: project.highlights.length > 0 ? [{ text: project.highlights.join(SEPARATOR) }] : [],
        })
      }
    })
  }

  if (certificates.length > 0) {
    section(doc, root, "Certificaciones", (sect) => {
      for (const certificate of certificates) {
        entry(doc, sect, {
          title: [{ text: certificate.name, bold: true }],
          subtitle: [certificate.issuer, formatOptionalDate(certificate.date)].filter(Boolean).join(SEPARATOR),
          notes: linkSegments(certificate.url),
        })
      }
    })
  }

  if (awards.length > 0) {
    section(doc, root, "Premios", (sect) => {
      for (const award of awards) {
        entry(doc, sect, {
          title: [{ text: award.title, bold: true }],
          subtitle: [award.awarder, formatOptionalDate(award.date)].filter(Boolean).join(SEPARATOR),
          summary: award.summary,
        })
      }
    })
  }

  if (publications.length > 0) {
    section(doc, root, "Publicaciones", (sect) => {
      for (const publication of publications) {
        entry(doc, sect, {
          title: [{ text: publication.name, bold: true }],
          subtitle: [publication.publisher, formatOptionalDate(publication.releaseDate)]
            .filter(Boolean)
            .join(SEPARATOR),
          summary: publication.summary,
          notes: linkSegments(publication.url),
        })
      }
    })
  }

  if (volunteer.length > 0) {
    section(doc, root, "Voluntariado", (sect) => {
      for (const item of volunteer) {
        entry(doc, sect, {
          title: [{ text: item.position, bold: true }],
          subtitle: [item.organization, formatMonthYearRange(item.startDate, item.endDate)].join(SEPARATOR),
          summary: item.summary,
          highlights: item.highlights,
        })
      }
    })
  }

  if (languages.length > 0) {
    section(doc, root, "Idiomas", (sect) => {
      for (const { language, fluency } of languages) {
        inline(doc, sect, "P", [{ text: `${language}: `, bold: true }, { text: fluency }])
      }
    })
  }

  root.end()
}

/** Genera el CV en PDF a partir de los datos de `cv.json`. */
export function createCvPdf(cv: CV): Promise<Uint8Array<ArrayBuffer>> {
  const { name, label } = cv.basics

  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    pdfVersion: "1.7",
    tagged: true,
    lang: "es-ES",
    displayTitle: true,
    info: {
      Title: `${name} - CV`,
      Author: name,
      Subject: label,
      Keywords: cv.skills.map(({ name }) => name).join(", "),
      Creator: "minimalist-portfolio-json",
    },
  })

  const chunks: Uint8Array[] = []
  const done = new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk))
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))))
    doc.on("error", reject)
  })

  renderCv(doc, cv)
  doc.end()

  return done
}
