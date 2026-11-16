import { existsSync } from "node:fs"
import { join } from "node:path"
// La foto es común a los dos idiomas del CV.
import { cvEs } from "@cv"

const isRemote = (src: string) => /^https?:\/\//.test(src)

const localPath = cvEs.basics.image && !isRemote(cvEs.basics.image) ? join(process.cwd(), "public", cvEs.basics.image) : null

/** Ruta absoluta de la foto si está en `public/` y existe. */
export const avatarFile = localPath && existsSync(localPath) ? localPath : null

/**
 * Ruta de la foto de perfil solo si existe (URL externa o archivo en `public/`).
 * Así evitamos renderizar una imagen rota mientras no se haya añadido la foto.
 */
export const avatar = cvEs.basics.image && (isRemote(cvEs.basics.image) || avatarFile) ? cvEs.basics.image : null

/**
 * Imagen para las vistas previas en redes sociales (Open Graph / Twitter).
 * Muchas plataformas no admiten AVIF, así que para fotos locales se genera una copia JPEG
 * en `src/pages/[image].jpg.ts`.
 */
export const SOCIAL_IMAGE_NAME = "og-image"
export const socialImage = avatarFile ? `/${SOCIAL_IMAGE_NAME}.jpg` : avatar

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
