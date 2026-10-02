# Minimalist Portfolio JSON

Portafolio personal minimalista construido con [Astro](https://astro.build) a partir de un único archivo `cv.json` (estándar [JSON Resume](https://jsonresume.org/schema)). Incluye la descarga del **CV en PDF optimizado para ATS**, generado automáticamente con los mismos datos.

Basado en [midudev/minimalist-portfolio-json](https://github.com/midudev/minimalist-portfolio-json).

## ✨ Características

- **Un solo origen de datos**: edita `cv.json` y se actualizan la web y el PDF.
- **CV en PDF compatible con ATS** en `/cv.pdf`, con botón «Descargar CV» y nombre de archivo `Nombre-Apellidos-CV.pdf`.
- **Paleta de comandos** con <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> (o el botón flotante en móvil): descargar CV, imprimir, enviar correo, llamar y abrir redes sociales.
- **Modo claro y oscuro** automático según el sistema.
- **Versión imprimible**: al imprimir se ocultan los controles y se muestran los datos de contacto en texto.
- **Accesible**: HTML semántico, navegación por teclado, etiquetas ARIA y sin violaciones en [axe](https://github.com/dequelabs/axe-core) (WCAG 2.2 AA).
- **SEO**: metadatos Open Graph/Twitter, URL canónica y datos estructurados `schema.org/Person`.
- **Responsive** y 100 % estático (sin JavaScript salvo la paleta de comandos).

## 🧰 Tecnologías

- [Astro 4](https://docs.astro.build) + TypeScript (modo `strict`)
- [PDFKit](https://pdfkit.org) para generar el PDF en tiempo de build
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
2. Añade tu foto como **`public/me.webp`** (o cambia `basics.image`). Si no existe, se muestran tus iniciales.
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
    │   ├── cv-pdf.ts        # Generador del PDF compatible con ATS
    │   ├── cv-download.ts   # Ruta y nombre del archivo PDF
    │   ├── dates.ts         # Formato de fechas
    │   └── avatar.ts        # Foto de perfil o iniciales
    ├── components/
    │   ├── KeyboardManager.astro  # Paleta de comandos (Ctrl/⌘ + K)
    │   ├── Section.astro
    │   └── sections/        # Hero, About, Experience, Education, Projects, Skills
    ├── icons/               # Iconos SVG como componentes
    ├── layouts/Layout.astro # HTML base, SEO, tema y estilos globales
    └── pages/
        ├── index.astro      # Portafolio
        └── cv.pdf.ts        # Endpoint del CV en PDF
```

## 🌍 Despliegue

El resultado de `pnpm build` es un sitio estático en `dist/` que puedes publicar en Vercel, Netlify, Cloudflare Pages o GitHub Pages sin configuración adicional.

## 🙌 Créditos

Diseño original y estructura de [@midudev](https://github.com/midudev) en [minimalist-portfolio-json](https://github.com/midudev/minimalist-portfolio-json).
