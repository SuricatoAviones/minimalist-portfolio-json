# AGENTS.md

Guía para agentes de IA (Claude Code, Codex, Cursor, Copilot…) que trabajen en este repositorio.

## Proyecto

Portafolio personal estático hecho con **Astro 4** + TypeScript (`strict`). Todo el contenido sale de `cv.json` (esquema [JSON Resume](https://jsonresume.org/schema)) y se usa en dos salidas:

1. La web (`src/pages/index.astro`).
2. El CV en PDF compatible con ATS (`src/pages/cv.pdf.ts` → `src/lib/cv-pdf.ts`), que en el build se exporta como `dist/cv.pdf`.

La interfaz y el contenido están en **español**: mantén ese idioma en textos visibles, `aria-label`, comentarios y encabezados del PDF.

## Comandos

Usa siempre **pnpm** (nunca npm ni yarn; no generes `package-lock.json` ni `yarn.lock`).

```sh
pnpm install   # dependencias
pnpm dev       # http://localhost:4321 (PDF en /cv.pdf)
pnpm check     # astro check: tipos y errores
pnpm build     # astro check + build estático en dist/
pnpm preview   # sirve dist/
```

Antes de dar una tarea por terminada, **`pnpm build` debe pasar sin errores ni avisos**.

## Arquitectura

```text
cv.json ──► src/cv.ts (alias @cv, tipado con src/types/cv.ts)
              ├─► src/components/sections/*.astro ─► src/pages/index.astro
              └─► src/lib/cv-pdf.ts ─► src/pages/cv.pdf.ts ─► dist/cv.pdf
```

- `@cv` apunta a `src/cv.ts` (no al JSON): importa así `import { basics, work } from "@cv"`. Ese módulo valida `cv.json` contra el tipo `CV`.
- `@/*` apunta a `src/*`.
- `src/lib/dates.ts`: formatea fechas parseando el texto (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`). **No uses `new Date()`** con fechas del CV: provoca desfases de zona horaria.
- `src/lib/cv-download.ts`: ruta (`/cv.pdf`) y nombre del archivo descargable. Reutilízalo en lugar de escribir la ruta a mano.
- `src/lib/avatar.ts`: usa la foto de `basics.image` solo si existe en `public/`; si no, iniciales.
- `src/components/KeyboardManager.astro`: paleta de comandos con `<dialog>` nativo y patrón combobox + listbox. Sin dependencias.
- `src/layouts/Layout.astro`: SEO, JSON-LD, estilos globales y **tokens de color** (`--color-*`) con tema claro/oscuro.

## Convenciones de código

- Componentes `.astro` con estilos *scoped*; nada de frameworks de UI ni Tailwind salvo que se pida.
- Colores siempre con las variables `--color-*` de `Layout.astro` (el modo oscuro depende de ellas). Si añades un color, defínelo en ambos temas y comprueba contraste AA.
- Las clases globales `.print` / `.no-print` controlan la versión impresa; los controles interactivos llevan `no-print`.
- Los iconos de `src/icons/` son decorativos (`aria-hidden="true"`); el nombre accesible va en el enlace o botón (`aria-label`).
- Enlaces externos: `target="_blank" rel="noopener noreferrer"` y avisar en el `aria-label` de que se abren en otra pestaña.
- Si una sección de `cv.json` puede venir vacía, no renderices un encabezado sin contenido.
- Sigue el estilo del archivo que edites (indentación, comillas, punto y coma).

## Reglas del PDF compatible con ATS (no romper)

Cualquier cambio en `src/lib/cv-pdf.ts` debe mantener:

- Una sola columna y orden de lectura lineal: **sin tablas, columnas, imágenes, iconos ni cuadros de texto**.
- Fuentes estándar (`Helvetica`, `Helvetica-Bold`); no uses `characterSpacing` (rompe la extracción de palabras).
- Encabezados de sección estándar en español y en mayúsculas.
- Contacto en el cuerpo del documento, nunca en cabeceras/pies; URLs visibles en texto.
- Fechas `MM/YYYY` con `formatMonthYear*` de `src/lib/dates.ts`; separadores ` | `.
- PDF etiquetado: todo el contenido dentro de `doc.struct(...)` (closures `() => doc.text(...)`), lo decorativo como `Artifact`, y enlaces dentro de estructuras `Link`. Firma correcta: `doc.struct(tag, {}, children)`.
- Metadatos (`Title`, `Author`, `Subject`, `Keywords`) e idioma `es-ES`.

Comprobación tras cambiar el PDF: `pnpm build` y extrae el texto (`pdftotext -raw dist/cv.pdf -` u otra herramienta). El texto debe salir en orden, con tildes correctas y sin caracteres extraños.

## Skills disponibles

Hay skills instaladas con autoskills (`skills-lock.json`) en `.agents/skills/` (copia en `.claude/skills/`). Consúltalas cuando la tarea encaje:

| Skill                       | Úsala para                                                      |
| :-------------------------- | :-------------------------------------------------------------- |
| `astro`                     | Componentes, páginas, endpoints, configuración y CLI de Astro   |
| `accessibility`             | Auditorías y mejoras WCAG 2.2 (teclado, ARIA, contraste)        |
| `seo`                       | Metadatos, datos estructurados, sitemap y robots                |
| `frontend-design`           | Cambios visuales; respeta la estética minimalista existente     |
| `typescript-advanced-types` | Tipos del CV y utilidades de tipos                              |
| `nodejs-best-practices`     | Código que corre en Node durante el build (p. ej. el PDF)       |
| `nodejs-backend-patterns`   | Solo si se añade un backend/adaptador SSR                       |

## Git

- Mensajes de commit en inglés, en imperativo y descriptivos (sigue el historial).
- **No añadas trailers `Co-Authored-By`** ni otras atribuciones: el único autor de los commits es el propietario del repositorio.
- No hagas `push` ni cambies la configuración de git sin que se pida.
