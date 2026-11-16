import type { APIRoute } from "astro"
import { cvEs } from "@cv"
import { createCvPdf } from "@/lib/cv-pdf"
import { cvPdfFilename } from "@/lib/cv-download"

// En `astro build` este endpoint se prerenderiza como `dist/cv.pdf` (español).
export const GET: APIRoute = async () => {
  const pdf = await createCvPdf(cvEs, "es")

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cvPdfFilename(cvEs.basics.name)}"`,
    },
  })
}
