import type { APIRoute, GetStaticPaths } from "astro"
import sharp from "sharp"
import { SOCIAL_IMAGE_NAME, avatarFile } from "@/lib/avatar"

// Copia JPEG cuadrada de la foto de perfil para las vistas previas en redes sociales,
// que no siempre admiten AVIF/WebP. Solo se genera si la foto existe en `public/`.
export const getStaticPaths = (() =>
  avatarFile ? [{ params: { image: SOCIAL_IMAGE_NAME } }] : []) satisfies GetStaticPaths

export const GET: APIRoute = async () => {
  if (!avatarFile) return new Response(null, { status: 404 })

  const jpeg = await sharp(avatarFile)
    .resize(600, 600, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()

  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg" },
  })
}
