import type { APIRoute } from "astro"
import { cvEn } from "@cv"
import { createCvPdf } from "@/lib/cv-pdf"
import { cvPdfFilename } from "@/lib/cv-download"

// En `astro build` este endpoint se prerenderiza como `dist/en/cv.pdf` (inglés).
export const GET: APIRoute = async () => {
  const pdf = await createCvPdf(cvEn, "en")

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cvPdfFilename(cvEn.basics.name)}"`,
    },
  })
}
