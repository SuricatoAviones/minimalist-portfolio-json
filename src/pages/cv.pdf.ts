import type { APIRoute } from "astro"
import cv from "@cv"
import { createCvPdf } from "@/lib/cv-pdf"
import { CV_PDF_FILENAME } from "@/lib/cv-download"

// En `astro build` este endpoint se prerenderiza como `dist/cv.pdf`.
export const GET: APIRoute = async () => {
  const pdf = await createCvPdf(cv)

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${CV_PDF_FILENAME}"`,
    },
  })
}
