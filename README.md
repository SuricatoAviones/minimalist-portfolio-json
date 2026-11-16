# Minimalist Portfolio JSON

Portafolio personal minimalista construido con [Astro](https://astro.build) a partir de un único archivo `cv.json` (estándar [JSON Resume](https://jsonresume.org/schema)). Incluye la descarga del **CV en PDF optimizado para ATS**, generado automáticamente con los mismos datos.

Basado en [midudev/minimalist-portfolio-json](https://github.com/midudev/minimalist-portfolio-json).

## ✨ Características

- **Un solo origen de datos**: edita `cv.json` y se actualizan la web y el PDF.
- **CV en PDF compatible con ATS** en `/cv.pdf`, con botón «Descargar CV» y nombre de archivo `Nombre-Apellidos-CV.pdf`.
- **Generador de CV desde JSON**: sube tu propio `cv.json` (JSON Resume) en la página y descarga el PDF equivalente, validado en el navegador y sin enviar el archivo a ningún servidor.
- **Paleta de comandos** con <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> (o el botón flotante en móvil): descargar CV, imprimir, enviar correo, llamar y abrir redes sociales.
- **Modo claro y oscuro** automático según el sistema.
- **Versión imprimible**: al imprimir se ocultan los controles y se muestran los datos de contacto en texto.
- **Accesible**: HTML semántico, navegación por teclado, etiquetas ARIA y sin violaciones en [axe](https://github.com/dequelabs/axe-core) (WCAG 2.2 AA).
- **SEO**: metadatos Open Graph/Twitter (con una copia JPEG de tu foto para las vistas previas), URL canónica y datos estructurados `schema.org/Person`.
- **Responsive** y 100 % estático (JavaScript solo para la paleta de comandos y el generador de CV, que carga su librería al usarse).

## 🧰 Tecnologías

- [Astro 4](https://docs.astro.build) + TypeScript (modo `strict`)
- [PDFKit](https://pdfkit.org) para generar el PDF y [sharp](https://sharp.pixelplumbing.com) para la imagen de vista previa, ambos en tiempo de build
- [pdf-lib](https://pdf-lib.js.org) para generar el PDF a partir del JSON que sube el visitante, en el navegador
- [pnpm](https://pnpm.io) como gestor de paquetes

## 🚀 Empezar

Requisitos: **Node.js 18.17.1+** y **pnpm** (se puede activar con `corepack enable`).

```sh
pnpm install
pnpm dev
```

Abre `http://localhost:4321`. El PDF está disponible en `http://localhost:4321/cv.pdf`.

## ✏️ Personalizar

1. Edita **`cv.json`** con tus datos. Sigue el esquema de JSON Resume; los tipos están en `src/types/cv.ts` y `pnpm check` avisa si falta algún campo obligatorio.
2. Añade tu foto en **`public/`** y apunta a ella en `basics.image` (por defecto `/me.avif`; vale AVIF, WebP, JPG o PNG). Si no existe, se muestran tus iniciales. Al compilar se genera `og-image.jpg` para las vistas previas en redes sociales, que no siempre admiten AVIF.
3. Si publicas el sitio en un dominio, configura `site` en `astro.config.mjs` para generar la URL canónica correcta (si no, se usa `basics.url`).

| Sección de `cv.json`                                                | Web | PDF |
| :------------------------------------------------------------------ | :-: | :-: |
| `basics` (nombre, titular, contacto, perfiles, resumen)             | ✅  | ✅  |
| `work`, `education`, `projects`, `skills`                           | ✅  | ✅  |
| `languages`, `certificates`, `awards`, `publications`, `volunteer`  |  —  | ✅  |
| `interests`, `references`                                           |  —  |  —  |

Las secciones vacías (`[]`) no se muestran. Los iconos de redes sociales disponibles son `GitHub`, `LinkedIn` y `X`; los de habilidades están en `src/icons/`.

## 📄 CV en PDF compatible con ATS

El endpoint `src/pages/cv.pdf.ts` genera el PDF con `src/lib/cv-pdf.ts`; en `pnpm build` se exporta como archivo estático `dist/cv.pdf`. El documento sigue las recomendaciones habituales para los sistemas de seguimiento de candidatos (ATS):

- **Una sola columna** y orden de lectura lineal: sin tablas, columnas, cuadros de texto, imágenes ni iconos.
- **Texto real y seleccionable** con fuente estándar (Helvetica) y codificación WinAnsi, que se extrae sin errores.
- **Encabezados estándar**: Perfil profesional, Experiencia laboral, Educación, Habilidades, Proyectos, Certificaciones, Idiomas…
- **Datos de contacto en el cuerpo** del documento (no en cabeceras ni pies de página) y URLs escritas en texto.
- **Fechas consistentes** en formato `MM/YYYY` y orden cronológico inverso (el de `cv.json`).
- **Palabras clave**: tecnologías y competencias extraídas de `skills`, también incluidas en los metadatos.
- **PDF etiquetado** (tagged PDF 1.7) con idioma `es-ES`, estructura de encabezados, listas y enlaces, y metadatos de título, autor y asunto.
- **Nombre de archivo profesional**: `Nombre-Apellidos-CV.pdf`.

Para comprobar cómo lo «lee» un ATS puedes extraer el texto, por ejemplo con `pdftotext -raw dist/cv.pdf -`.

## 🧩 Generar un CV desde tu JSON

La sección «Genera tu CV desde un JSON», al final de la página, permite subir cualquier archivo [JSON Resume](https://jsonresume.org/schema) y descargar su PDF:

1. Elige (o arrastra) un `.json` de hasta 4 MB.
2. Se valida en el navegador con `src/lib/cv-schema.ts`: avisa con la ruta exacta de cada problema (`work[1].startDate: debe ser una fecha con formato AAAA…`).
3. Si todo es correcto, `src/lib/cv-pdf-browser.ts` genera el PDF con pdf-lib y `src/lib/cv-content.ts` compone las secciones, y el archivo se descarga como `Nombre-Apellidos-CV.pdf`.

El archivo **no se sube a ningún servidor**: todo ocurre en el navegador y la web sigue siendo estática. El diseño y el orden del contenido son los mismos que los del CV de `/cv.pdf`, porque ambos generadores comparten `cv-content.ts` y `cv-pdf-theme.ts`. La única diferencia es que el PDF generado en el navegador no es un PDF etiquetado (pdf-lib no lo permite), aunque conserva texto real, una sola columna y encabezados estándar, que es lo que necesitan los ATS.

## 🧞 Comandos

| Comando              | Acción                                                  |
| :------------------- | :------------------------------------------------------ |
| `pnpm install`       | Instala las dependencias                                |
| `pnpm dev`           | Servidor de desarrollo en `localhost:4321`              |
| `pnpm check`         | Comprueba tipos y errores de Astro (`astro check`)      |
| `pnpm build`         | Comprueba tipos y genera el sitio y el PDF en `./dist/` |
| `pnpm preview`       | Sirve localmente la versión de producción               |
| `pnpm astro ...`     | Ejecuta comandos de la CLI de Astro                     |

## 📁 Estructura

```text
/
├── cv.json                  # Tus datos (JSON Resume)
├── public/                  # Archivos estáticos (favicon, foto)
└── src/
    ├── cv.ts                # Módulo tipado del CV (alias @cv)
    ├── types/cv.ts          # Tipos del esquema JSON Resume
    ├── lib/
    │   ├── cv-content.ts    # Modelo de secciones que comparten ambos PDF
    │   ├── cv-pdf.ts        # Generador del PDF del build (PDFKit, PDF etiquetado)
    │   ├── cv-pdf-browser.ts# Generador del PDF en el navegador (pdf-lib)
    │   ├── cv-pdf-theme.ts  # Tamaños, colores y márgenes del PDF
    │   ├── cv-schema.ts     # Validación del JSON que sube el visitante
    │   ├── cv-filename.ts   # Nombre de archivo `Nombre-Apellidos-CV.pdf`
    │   ├── cv-download.ts   # Ruta y nombre del archivo PDF
    │   ├── dates.ts         # Formato de fechas
    │   └── avatar.ts        # Foto de perfil, iniciales e imagen social
    ├── components/
    │   ├── KeyboardManager.astro  # Paleta de comandos (Ctrl/⌘ + K)
    │   ├── CvGenerator.astro      # Subida de JSON y descarga del PDF
    │   ├── Section.astro
    │   └── sections/        # Hero, About, Experience, Education, Projects, Skills
    ├── icons/               # Iconos SVG como componentes
    ├── layouts/Layout.astro # HTML base, SEO, tema y estilos globales
    └── pages/
        ├── index.astro      # Portafolio
        ├── cv.pdf.ts        # Endpoint del CV en PDF
        └── [image].jpg.ts   # Copia JPEG de la foto para Open Graph
```

## 🌍 Despliegue

El resultado de `pnpm build` es un sitio estático en `dist/` que puedes publicar en Vercel, Netlify, Cloudflare Pages o GitHub Pages sin configuración adicional.

## 🙌 Créditos

Diseño original y estructura de [@midudev](https://github.com/midudev) en [minimalist-portfolio-json](https://github.com/midudev/minimalist-portfolio-json).
