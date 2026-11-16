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
              └─► src/lib/cv-content.ts
                    ├─► src/lib/cv-pdf.ts ─► src/pages/cv.pdf.ts ─► dist/cv.pdf
                    └─► src/lib/cv-pdf-browser.ts ─► CvGenerator.astro (PDF al subir un JSON)
```

- `@cv` apunta a `src/cv.ts` (no al JSON): importa así `import { basics, work } from "@cv"`. Ese módulo valida `cv.json` contra el tipo `CV`.
- `@/*` apunta a `src/*`.
- `src/lib/cv-content.ts`: modelo intermedio (secciones y bloques) que comparten el PDF del build y el del navegador. **Añade o reordena secciones aquí**, no en cada generador, para que ambos PDF coincidan.
- `src/lib/cv-pdf-theme.ts`: tamaños, colores, márgenes y fuentes del PDF; cualquier retoque visual debe ir en este archivo.
- `src/lib/cv-schema.ts`: validación estricta del JSON que sube el visitante (mensajes en español con la ruta del campo). Normaliza las listas opcionales a `[]`; no usa APIs de Node para que funcione en el navegador.
- `src/components/CvGenerator.astro`: sección «Genera tu CV desde un JSON». Carga pdf-lib con `import()` solo al usarse, para no penalizar la carga inicial. El archivo del visitante nunca sale del navegador.
- `src/lib/dates.ts`: formatea fechas parseando el texto (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`). **No uses `new Date()`** con fechas del CV: provoca desfases de zona horaria.
- `src/lib/cv-download.ts`: ruta (`/cv.pdf`) y nombre del archivo descargable (calculado con `src/lib/cv-filename.ts`). Reutilízalo en lugar de escribir la ruta a mano.
- `src/lib/avatar.ts`: usa la foto de `basics.image` solo si existe en `public/`; si no, iniciales. `src/pages/[image].jpg.ts` genera con sharp `/og-image.jpg` (las redes sociales no siempre admiten AVIF) para `og:image`/`twitter:image`.
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

`src/lib/cv-pdf-browser.ts` (PDF que genera el visitante con pdf-lib) debe cumplir las mismas reglas salvo el etiquetado, que pdf-lib no soporta:

- Dibuja cada línea dentro de un único bloque de texto (`beginText`/`endText`) y agrupa las palabras con la misma fuente: si se dibuja palabra por palabra, la extracción añade saltos de línea entre ellas.
- Reutiliza la fuente registrada en la página (`fontKey`) en lugar de llamar a `drawText` con `font`; si no, pdf-lib crea un diccionario de fuente por palabra y el PDF se hincha.
- Las fuentes estándar solo admiten WinAnsi: pasa el texto por `sanitize()` antes de medirlo y dibujarlo.
- Usa el modelo de `cv-content.ts` y los tokens de `cv-pdf-theme.ts`; no dupliques textos ni medidas.

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
