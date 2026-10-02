import { existsSync } from "node:fs"
import { join } from "node:path"
import { basics } from "@cv"

/**
 * Devuelve la ruta de la foto de perfil solo si existe (URL externa o archivo en `public/`).
 * Así evitamos renderizar una imagen rota mientras no se haya añadido la foto.
 */
function resolveAvatar(image?: string) {
  if (!image) return null
  if (/^https?:\/\//.test(image)) return image
  return existsSync(join(process.cwd(), "public", image)) ? image : null
}

export const avatar = resolveAvatar(basics.image)

export const initials = basics.name
  .split(/\s+/)
  .slice(0, 2)
  .map((word) => word[0]?.toUpperCase() ?? "")
  .join("")
