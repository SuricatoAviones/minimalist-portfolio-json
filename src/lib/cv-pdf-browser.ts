import {
  PDFDocument,
  PDFString,
  StandardFonts,
  beginText,
  endText,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setFillingRgbColor,
  setFontAndSize,
  setTextMatrix,
  showText,
  type PDFFont,
  type PDFName,
  type PDFPage,
} from "pdf-lib"
import type { CV } from "@/types/cv"
import { buildCvContent, type CvBlock, type CvContent, type CvEntry, type Segment } from "@/lib/cv-content"
import {
  PDF_COLOR,
  PDF_LINE_GAP,
  PDF_MARGIN,
  PDF_PAGE,
  PDF_SIZE,
  PDF_BULLET_INDENT,
} from "@/lib/cv-pdf-theme"

/*
 * Generador del CV en PDF que se ejecuta en el navegador, para que el visitante
 * pueda subir su propio `cv.json` (JSON Resume) y descargar el PDF sin enviar
 * nada a ningún servidor. El sitio sigue siendo 100 % estático.
 *
 * Mantiene las mismas reglas que el PDF del build (`cv-pdf.ts`): una sola
 * columna, Helvetica, encabezados estándar, fechas MM/YYYY y texto extraíble
 * por los ATS. pdf-lib no permite crear PDF etiquetado, así que ese detalle
 * (estructura de accesibilidad) solo está en el PDF publicado en /cv.pdf.
 */

const { width: PAGE_WIDTH, height: PAGE_HEIGHT } = PDF_PAGE
const CONTENT_WIDTH = PAGE_WIDTH - PDF_MARGIN * 2
const LINE_UNIT = PDF_SIZE.body * 1.2
const ASCENT = 0.78

/** Caracteres que la codificación WinAnsi de las fuentes estándar sabe escribir. */
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ"

function sanitize(text: string) {
  let clean = ""
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.includes(char)) {
      clean += char
    } else if (char === "\t" || char === "\n") {
      clean += " "
    }
  }
  return clean
}

function rgbValues(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16) / 255,
    Number.parseInt(hex.slice(3, 5), 16) / 255,
    Number.parseInt(hex.slice(5, 7), 16) / 255,
  ]
}

function color(hex: string) {
  return rgb(...rgbValues(hex))
}

interface Token {
  text: string
  font: PDFFont
  link?: string
}

/** Fragmento de una línea que comparte fuente y enlace. */
interface Run {
  x: number
  text: string
  font: PDFFont
  link?: string
}

class CvWriter {
  private doc: PDFDocument
  private regular: PDFFont
  private bold: PDFFont
  private page!: PDFPage
  private regularKey?: PDFName
  private boldKey?: PDFName
  /** Distancia desde el borde superior de la página hasta el inicio del siguiente contenido. */
  private top = PDF_MARGIN

  constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.doc = doc
    this.regular = regular
    this.bold = bold
    this.addPage()
  }

  private get bottom() {
    return PAGE_HEIGHT - PDF_MARGIN
  }

  private addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.regularKey = undefined
    this.boldKey = undefined
    this.top = PDF_MARGIN
  }

  /** Registra la fuente estándar en la página una sola vez y reutiliza su clave. */
  private fontKey(font: PDFFont) {
    const key = font === this.bold ? this.boldKey : this.regularKey
    if (key) return key
    const name = this.page.node.newFontDictionary(font.name, font.ref)
    if (font === this.bold) this.boldKey = name
    else this.regularKey = name
    return name
  }

  private ensureSpace(height: number) {
    if (this.top + height > this.bottom) this.addPage()
  }

  /** Equivale a `doc.moveDown(n)` de PDFKit. */
  private space(lines: number) {
    this.top += lines * LINE_UNIT
  }

  private lineHeight(size: number) {
    return size * 1.2 + PDF_LINE_GAP
  }

  private tokenize(segments: Segment[]): Token[] {
    const tokens: Token[] = []
    for (const segment of segments) {
      const font = segment.bold ? this.bold : this.regular
      const text = sanitize(segment.text)
      for (const word of text.split(/\s+/)) {
        if (word) tokens.push({ text: word, font, link: segment.link })
      }
    }
    return tokens
  }

  private width(token: Token, size: number) {
    return token.font.widthOfTextAtSize(token.text, size)
  }

  /** Reparte las palabras en líneas sin partir palabras (salvo URLs kilométricas). */
  private wrap(tokens: Token[], size: number, maxWidth: number): Token[][] {
    const lines: Token[][] = []
    const spaceWidth = this.regular.widthOfTextAtSize(" ", size)
    let line: Token[] = []
    let lineWidth = 0

    const startLine = (token: Token) => {
      const tokenWidth = this.width(token, size)
      if (tokenWidth <= maxWidth) {
        line = [token]
        lineWidth = tokenWidth
        return
      }

      const parts = this.splitWord(token, size, maxWidth)
      for (const part of parts.slice(0, -1)) lines.push([part])
      const last = parts[parts.length - 1]
      line = [last]
      lineWidth = this.width(last, size)
    }

    for (const token of tokens) {
      const tokenWidth = this.width(token, size)

      if (line.length === 0) {
        startLine(token)
      } else if (lineWidth + spaceWidth + tokenWidth > maxWidth) {
        lines.push(line)
        startLine(token)
      } else {
        line.push(token)
        lineWidth += spaceWidth + tokenWidth
      }
    }

    if (line.length > 0) lines.push(line)
    return lines
  }

  private splitWord(token: Token, size: number, maxWidth: number): Token[] {
    const parts: Token[] = []
    let current = ""
    for (const char of token.text) {
      const next = current + char
      if (current && token.font.widthOfTextAtSize(next, size) > maxWidth) {
        parts.push({ ...token, text: current })
        current = char
      } else {
        current = next
      }
    }
    if (current) parts.push({ ...token, text: current })
    return parts
  }

  private addLink(x: number, baseline: number, width: number, size: number, url: string) {
    const annotation = this.doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, baseline - size * 0.25, x + width, baseline + size * 0.85],
      Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
    })
    this.page.node.addAnnot(this.doc.context.register(annotation))
  }

  /**
   * Dibuja una línea completa dentro de un único objeto de texto (`BT`/`ET`).
   * Así el texto queda agrupado por líneas también al extraerlo con un ATS;
   * si se dibujara palabra por palabra, muchos lectores añadirían saltos de línea.
   */
  private drawRuns(runs: Run[], size: number, hex: string, baseline: number) {
    const [red, green, blue] = rgbValues(hex)
    const operators = [
      pushGraphicsState(),
      setFillingRgbColor(red, green, blue),
      beginText(),
    ]
    let expectedX: number | null = null

    for (const run of runs) {
      if (expectedX === null || Math.abs(run.x - expectedX) > 0.01) {
        operators.push(setTextMatrix(1, 0, 0, 1, run.x, baseline))
      }
      operators.push(setFontAndSize(this.fontKey(run.font), size), showText(run.font.encodeText(run.text)))
      if (run.link) {
        this.addLink(run.x, baseline, run.font.widthOfTextAtSize(run.text.trimEnd(), size), size, run.link)
      }
      expectedX = run.x + run.font.widthOfTextAtSize(run.text, size)
    }

    operators.push(endText(), popGraphicsState())
    this.page.pushOperators(...operators)
  }

  /** Agrupa las palabras de una línea en fragmentos con la misma fuente y enlace. */
  private lineRuns(tokens: Token[], size: number, startX: number): Run[] {
    const runs: Run[] = []
    let x = startX

    tokens.forEach((token, index) => {
      const text = index < tokens.length - 1 ? `${token.text} ` : token.text
      const last = runs[runs.length - 1]
      if (last && last.font === token.font && last.link === token.link) last.text += text
      else runs.push({ x, text, font: token.font, link: token.link })
      x += token.font.widthOfTextAtSize(text, size)
    })

    return runs
  }

  /** Dibuja un párrafo con saltos de línea y enlaces. */
  private paragraph(segments: Segment[], size: number, hex: string, maxWidth = CONTENT_WIDTH, startX = PDF_MARGIN) {
    for (const line of this.wrap(this.tokenize(segments), size, maxWidth)) {
      const height = this.lineHeight(size)
      this.ensureSpace(height)
      const baseline = PAGE_HEIGHT - this.top - size * ASCENT
      this.drawRuns(this.lineRuns(line, size, startX), size, hex, baseline)
      this.top += height
    }
  }

  private bullets(items: string[]) {
    for (const item of items) {
      const lines = this.wrap(
        this.tokenize([{ text: item }]),
        PDF_SIZE.body,
        CONTENT_WIDTH - PDF_BULLET_INDENT
      )
      for (const [index, line] of lines.entries()) {
        const height = this.lineHeight(PDF_SIZE.body)
        this.ensureSpace(height)
        const baseline = PAGE_HEIGHT - this.top - PDF_SIZE.body * ASCENT
        const runs = this.lineRuns(line, PDF_SIZE.body, PDF_MARGIN + PDF_BULLET_INDENT)
        if (index === 0) runs.unshift({ x: PDF_MARGIN + 2, text: "•", font: this.regular })
        this.drawRuns(runs, PDF_SIZE.body, PDF_COLOR.text, baseline)
        this.top += height
      }
    }
  }

  private entry({ title, subtitle, summary, highlights = [], notes = [] }: CvEntry) {
    this.ensureSpace(60)
    this.paragraph(title, PDF_SIZE.title, PDF_COLOR.text)
    if (subtitle) this.paragraph([{ text: subtitle }], PDF_SIZE.meta, PDF_COLOR.muted)
    if (summary) {
      this.space(0.2)
      this.paragraph([{ text: summary }], PDF_SIZE.body, PDF_COLOR.text)
    }
    if (highlights.length > 0) {
      this.space(0.2)
      this.bullets(highlights)
    }
    if (notes.length > 0) this.paragraph(notes, PDF_SIZE.meta, PDF_COLOR.muted)
    this.space(0.7)
  }

  private block(content: CvBlock) {
    if (content.type === "paragraph") {
      if (content.spaceBefore) this.space(content.spaceBefore)
      this.paragraph(content.segments, PDF_SIZE.body, PDF_COLOR.text)
      return
    }
    for (const item of content.entries) this.entry(item)
  }

  private section(title: string) {
    this.ensureSpace(80)
    if (this.top > PDF_MARGIN + 0.5) this.space(0.9)

    this.paragraph([{ text: sanitize(title.toUpperCase()), bold: true }], PDF_SIZE.heading, PDF_COLOR.text)

    const y = PAGE_HEIGHT - this.top - 2
    this.page.drawLine({
      start: { x: PDF_MARGIN, y },
      end: { x: PAGE_WIDTH - PDF_MARGIN, y },
      thickness: 0.6,
      color: color(PDF_COLOR.rule),
    })
    this.top += 8
  }

  render(content: CvContent) {
    this.paragraph([{ text: content.name, bold: true }], PDF_SIZE.name, PDF_COLOR.text)
    this.space(0.15)
    this.paragraph([{ text: content.label }], PDF_SIZE.label, PDF_COLOR.text)
    this.space(0.3)

    for (const line of content.lines) this.paragraph(line, PDF_SIZE.meta, PDF_COLOR.muted)

    for (const section of content.sections) {
      this.section(section.title)
      for (const block of section.blocks) this.block(block)
    }
  }
}

/** Genera en el navegador el CV en PDF a partir de cualquier JSON Resume validado. */
export async function createCvPdfBrowser(cv: CV): Promise<Uint8Array> {
  const content = buildCvContent(cv)
  const { name, label } = cv.basics

  const doc = await PDFDocument.create()
  doc.setTitle(`${name} - CV`)
  doc.setAuthor(name)
  doc.setSubject(label)
  doc.setKeywords(cv.skills.map(({ name }) => name))
  doc.setCreator("minimalist-portfolio-json")
  doc.setProducer("minimalist-portfolio-json")
  doc.setLanguage("es-ES")

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  new CvWriter(doc, regular, bold).render(content)

  return doc.save()
}
