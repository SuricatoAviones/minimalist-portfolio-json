# AGENTS.md

Guía para agentes de IA (Claude Code, Codex, Cursor, Copilot…) que trabajen en este repositorio.

## Proyecto

Portafolio personal estático bilingüe hecho con **Astro 4** + TypeScript (`strict`). El contenido vive en `cv.json` (inglés) y `cv.es.json` (español), ambos con el esquema [JSON Resume](https://jsonresume.org/schema), y se usa en dos salidas por idioma:

1. La web: `/` en español (`src/pages/index.astro`) y `/en/` en inglés (`src/pages/en/index.astro`), renderizadas por `src/components/Portfolio.astro`.
2. El CV en PDF compatible con ATS: `/cv.pdf` en español y `/en/cv.pdf` en inglés (`src/pages/cv.pdf.ts` y `src/pages/en/cv.pdf.ts` → `src/lib/cv-pdf.ts`).

La interfaz está traducida en `src/i18n/ui.ts`: cualquier texto visible o `aria-label` debe salir de ahí, no escribirse a mano en los componentes. Los comentarios del código se mantienen en español.

## Comandos

Usa siempre **pnpm** (nunca npm ni yarn; no generes `package-lock.json` ni `yarn.lock`).

```sh
pnpm install   # dependencias
pnpm dev       # http://localhost:4321 (es) y /en/ (en); PDF en /cv.pdf y /en/cv.pdf
pnpm check     # astro check: tipos y errores
pnpm build     # astro check + build estático en dist/
pnpm preview   # sirve dist/
```

Antes de dar una tarea por terminada, **`pnpm build` debe pasar sin errores ni avisos**.

## Arquitectura

```text
cv.json (EN) / cv.es.json (ES) ──► src/cv.ts (alias @cv, tipado con src/types/cv.ts)
              ├─► src/components/Portfolio.astro ─► src/pages/index.astro (es) y src/pages/en/index.astro (en)
              └─► src/lib/cv-content.ts (cv, lang)
                    ├─► src/lib/cv-pdf.ts ─► src/pages/cv.pdf.ts y src/pages/en/cv.pdf.ts
                    └─► src/lib/cv-pdf-browser.ts ─► CvGenerator.astro (PDF al subir un JSON, idioma de la página)
```

- `@cv` exporta `cvEn`, `cvEs` y `cvs` (mapa por idioma). Importa `import { cvs } from "@cv"` o el CV concreto (`cvEs`/`cvEn`).
- `src/i18n/ui.ts`: diccionario `es`/`en`, rutas (`/` y `/en/`), etiquetas de locale y textos compartidos. Añade ahí cualquier cadena nueva.
- `src/components/Portfolio.astro`: composición común de la web; recibe `lang`, elige el CV y pasa los datos a cada sección.
- `src/components/LanguageSwitcher.astro`: selector ES/EN con `hreflang`, `lang` y `aria-current`.
- `@/*` apunta a `src/*`.
- `src/lib/cv-content.ts`: modelo intermedio (secciones y bloques) que comparten el PDF del build y el del navegador. **Añade o reordena secciones aquí**, no en cada generador, para que ambos PDF coincidan. Recibe `buildCvContent(cv, lang)`.
- `src/lib/cv-pdf-theme.ts`: tamaños, colores, márgenes y fuentes del PDF; cualquier retoque visual debe ir en este archivo.
- `src/lib/cv-schema.ts`: validación estricta del JSON que sube el visitante (`validateCv(data, lang)`, mensajes en el idioma de la página con la ruta del campo). Normaliza las listas opcionales a `[]`; no usa APIs de Node para que funcione en el navegador.
- `src/components/CvGenerator.astro`: sección «Genera tu CV desde un JSON» / «Generate your CV from a JSON». Carga pdf-lib con `import()` solo al usarse, para no penalizar la carga inicial. El archivo del visitante nunca sale del navegador y el PDF se genera en el idioma de la página.
- `src/lib/dates.ts`: formatea fechas parseando el texto (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`). **No uses `new Date()`** con fechas del CV: provoca desfases de zona horaria. La etiqueta de «actualidad» se pasa desde `ui`.
- `src/lib/cv-download.ts`: rutas (`/cv.pdf` y `/en/cv.pdf`) y nombre del archivo descargable (calculado con `src/lib/cv-filename.ts`). Reutiliza `cvPdfPath(lang)`/`cvPdfFilename(name)` en lugar de escribir la ruta a mano.
- `src/lib/avatar.ts`: usa la foto de `cvEs.basics.image` (común a los dos idiomas) solo si existe en `public/`; si no, iniciales. `src/pages/[image].jpg.ts` genera con sharp `/og-image.jpg` (las redes sociales no siempre admiten AVIF) para `og:image`/`twitter:image`.
- `src/components/KeyboardManager.astro`: paleta de comandos con `<dialog>` nativo y patrón combobox + listbox, localizada por `lang`. Sin dependencias.
- `src/layouts/Layout.astro`: SEO, `hreflang`, `canonical`, JSON-LD, estilos globales y **tokens de color** (`--color-*`) con tema claro/oscuro. Recibe `lang` y `cv`.

## Convenciones de código

- Componentes `.astro` con estilos *scoped*; nada de frameworks de UI ni Tailwind salvo que se pida.
- Las secciones reciben `lang` y sus datos del CV por props; no importan `@cv` directamente, para poder renderizar ambos idiomas.
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
- Encabezados de sección estándar en el idioma del CV y en mayúsculas.
- Contacto en el cuerpo del documento, nunca en cabeceras/pies; URLs visibles en texto.
- Fechas `MM/YYYY` con `formatMonthYear*` de `src/lib/dates.ts`; separadores ` | `.
- PDF etiquetado: todo el contenido dentro de `doc.struct(...)` (closures `() => doc.text(...)`), lo decorativo como `Artifact`, y enlaces dentro de estructuras `Link`. Firma correcta: `doc.struct(tag, {}, children)`.
- Metadatos (`Title`, `Author`, `Subject`, `Keywords`) e idioma según el CV: `es-ES` o `en-US` (usa `localeTag` de `src/i18n/ui.ts`).

Comprobación tras cambiar el PDF: `pnpm build` y extrae el texto de `dist/cv.pdf` y `dist/en/cv.pdf` (`pdftotext -raw ...` u otra herramienta). El texto debe salir en orden, con tildes correctas y sin caracteres extraños.

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
