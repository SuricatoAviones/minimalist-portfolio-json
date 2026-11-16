import PDFDocument from "pdfkit"
import type { CV } from "@/types/cv"
import { localeTag, type Lang } from "@/i18n/ui"
import {
  buildCvContent,
  type CvBlock,
  type CvContent,
  type CvEntry,
  type CvSection,
  type Segment,
} from "@/lib/cv-content"
import {
  PDF_COLOR as COLOR,
  PDF_FONT as FONT,
  PDF_LINE_GAP as LINE_GAP,
  PDF_MARGIN as MARGIN,
  PDF_SIZE as SIZE,
  PDF_BULLET_INDENT as BULLET_INDENT,
} from "@/lib/cv-pdf-theme"

/*
 * Generador del CV en PDF optimizado para ATS (Applicant Tracking Systems):
 * - Una sola columna y orden de lectura lineal: sin tablas, cuadros de texto, iconos ni imágenes.
 * - Fuente estándar (Helvetica) con codificación WinAnsi: el texto es seleccionable y extraíble.
 * - Encabezados de sección estándar en el idioma del CV ("Work Experience", "Experiencia laboral"...).
 * - Datos de contacto en el cuerpo del documento (no en cabeceras ni pies de página).
 * - Fechas en formato MM/YYYY y URLs escritas completas en texto plano.
 * - PDF etiquetado (tagged) con idioma y metadatos (título, autor, asunto y palabras clave).
 *
 * El orden y el formato del contenido viven en `src/lib/cv-content.ts`, que comparten
 * este generador y el del navegador (`src/lib/cv-pdf-browser.ts`).
 */

type Doc = PDFKit.PDFDocument
type Struct = PDFKit.PDFStructureElement

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
  { size = SIZE.body, color = COLOR.text }: { size?: number; color?: string } = {}
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

function entry(doc: Doc, parent: Struct, { title, subtitle, summary, highlights = [], notes = [] }: CvEntry) {
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

function block(doc: Doc, parent: Struct, content: CvBlock) {
  if (content.type === "paragraph") {
    if (content.spaceBefore) doc.moveDown(content.spaceBefore)
    inline(doc, parent, "P", content.segments)
    return
  }

  for (const item of content.entries) entry(doc, parent, item)
}

function cvSection(doc: Doc, root: Struct, { title, blocks }: CvSection) {
  section(doc, root, title, (sect) => {
    for (const item of blocks) block(doc, sect, item)
  })
}

function renderCv(doc: Doc, content: CvContent) {
  const root = doc.struct("Document")
  doc.addStructure(root)

  // Cabecera: nombre, titular y contacto en texto plano dentro del cuerpo.
  inline(doc, root, "H1", [{ text: content.name, bold: true }], { size: SIZE.name })
  doc.moveDown(0.15)
  paragraph(doc, root, content.label, { size: SIZE.label })
  doc.moveDown(0.3)

  for (const line of content.lines) {
    inline(doc, root, "P", line, { size: SIZE.meta, color: COLOR.muted })
  }

  for (const item of content.sections) cvSection(doc, root, item)

  root.end()
}

/** Genera el CV en PDF a partir de los datos de `cv.json` en el idioma indicado. */
export function createCvPdf(cv: CV, lang: Lang = "es"): Promise<Uint8Array<ArrayBuffer>> {
  const content = buildCvContent(cv, lang)
  const { name, label } = cv.basics

  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    pdfVersion: "1.7",
    tagged: true,
    lang: localeTag[lang],
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

  renderCv(doc, content)
  doc.end()

  return done
}
