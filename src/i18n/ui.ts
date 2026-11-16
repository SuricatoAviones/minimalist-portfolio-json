/*
 * Textos de la interfaz en los dos idiomas del sitio y utilidades de idioma.
 * El contenido del CV vive en `cv.json` (inglés) y `cv.es.json` (español);
 * aquí solo van las cadenas que no forman parte de los datos del CV.
 */

export const languages = ["es", "en"] as const

export type Lang = (typeof languages)[number]

/** Etiqueta BCP 47 para `<html lang>` y los metadatos del PDF. */
export const localeTag: Record<Lang, string> = {
  es: "es-ES",
  en: "en-US",
}

/** Locale de Open Graph (`og:locale`). */
export const openGraphLocale: Record<Lang, string> = {
  es: "es_ES",
  en: "en_US",
}

/** Ruta de la portada de cada idioma. */
export const routes: Record<Lang, string> = {
  es: "/",
  en: "/en/",
}

interface Dictionary {
  languageNav: string
  languageName: string
  languageShort: string
  present: string
  meta: {
    imageAlt: (name: string) => string
    cvAlternate: (name: string) => string
  }
  validation: {
    required: string
    requiredObject: string
    text: string
    date: string
    object: string
    list: string
    root: string
  }
  sections: {
    about: string
    experience: string
    education: string
    projects: string
    skills: string
  }
  hero: {
    contact: string
    emailLabel: (email: string) => string
    emailTitle: (name: string, email: string) => string
    phoneLabel: (phone: string) => string
    phoneTitle: (name: string, phone: string) => string
    profileLabel: (network: string) => string
    profileTitle: (name: string, network: string) => string
    downloadTitle: string
    download: string
    avatarAlt: (name: string) => string
  }
  experience: {
    view: (name: string) => string
  }
  education: {
    view: (institution: string) => string
  }
  projects: {
    activeTitle: string
    activeLabel: string
    view: (name: string) => string
    sourceTitle: (name: string) => string
    sourceLabel: (name: string) => string
  }
  generator: {
    title: string
    introStart: string
    introAfterFile: string
    schemaLink: string
    schemaLinkLabel: string
    introMiddle: string
    myCv: string
    introEnd: string
    dropTitle: string
    dropOr: string
    dropHint: string
    download: string
    noscript: string
    fileTooLarge: string
    invalidJson: (detail: string) => string
    unknownFormat: string
    oneIssue: string
    manyIssues: (count: number) => string
    moreIssues: (count: number) => string
    generating: string
    ready: (name: string) => string
    failed: string
  }
  keyboard: {
    hintBefore: string
    hintAfter: string
    open: string
    palette: string
    search: string
    commands: string
    empty: string
    navigate: string
    select: string
    close: string
    download: string
    print: string
    email: string
    phone: string
    visit: (network: string) => string
    actions: string
    social: string
  }
  pdf: {
    sections: {
      summary: string
      work: string
      education: string
      skills: string
      projects: string
      certificates: string
      awards: string
      publications: string
      volunteer: string
      languages: string
    }
    technologies: string
    competencies: string
  }
}

export const ui: Record<Lang, Dictionary> = {
  es: {
    languageNav: "Idioma del sitio",
    languageName: "Español",
    languageShort: "ES",
    present: "Actualidad",
    meta: {
      imageAlt: (name) => `Foto de ${name}`,
      cvAlternate: (name) => `CV de ${name} (PDF)`,
    },
    validation: {
      required: "es un campo obligatorio y no puede estar vacío.",
      requiredObject: "es un campo obligatorio y debe ser un objeto.",
      text: "debe ser texto.",
      date: "debe ser una fecha con formato AAAA, AAAA-MM o AAAA-MM-DD.",
      object: "debe ser un objeto.",
      list: "debe ser una lista.",
      root: "El archivo debe contener un objeto JSON con los datos del CV.",
    },
    sections: {
      about: "Sobre mí",
      experience: "Experiencia laboral",
      education: "Educación",
      projects: "Proyectos",
      skills: "Habilidades",
    },
    hero: {
      contact: "Contacto y redes sociales",
      emailLabel: (email) => `Enviar un correo electrónico a ${email}`,
      emailTitle: (name, email) => `Enviar un correo electrónico a ${name} al correo ${email}`,
      phoneLabel: (phone) => `Llamar al ${phone}`,
      phoneTitle: (name, phone) => `Llamar por teléfono a ${name} al número ${phone}`,
      profileLabel: (network) => `Perfil de ${network} (se abre en una pestaña nueva)`,
      profileTitle: (name, network) => `Visitar el perfil de ${name} en ${network}`,
      downloadTitle: "Descargar el CV en PDF optimizado para ATS",
      download: "Descargar CV",
      avatarAlt: (name) => `Foto de ${name}`,
    },
    experience: {
      view: (name) => `Ver ${name}`,
    },
    education: {
      view: (institution) => `Ver ${institution}`,
    },
    projects: {
      activeTitle: "Proyecto activo",
      activeLabel: "(activo)",
      view: (name) => `Ver el proyecto ${name}`,
      sourceTitle: (name) => `Ver el código fuente del proyecto ${name}`,
      sourceLabel: (name) => `Código fuente de ${name} en GitHub (se abre en una pestaña nueva)`,
    },
    generator: {
      title: "Genera tu CV desde un JSON",
      introStart: "Sube tu archivo",
      introAfterFile: "(formato ",
      schemaLink: "JSON Resume",
      schemaLinkLabel: "Esquema JSON Resume (se abre en una pestaña nueva)",
      introMiddle: ") y descarga un PDF con el mismo diseño y formato compatible con ATS que",
      myCv: "mi CV",
      introEnd: ". El archivo se procesa en tu navegador: no se sube a ningún servidor.",
      dropTitle: "Arrastra tu",
      dropOr: "o pulsa para seleccionarlo",
      dropHint: "JSON Resume · máximo 4 MB",
      download: "Descargar CV",
      noscript: "Necesitas activar JavaScript para generar un PDF desde tu archivo.",
      fileTooLarge: "El archivo supera los 4 MB. Prueba con un JSON más pequeño.",
      invalidJson: (detail) => `El archivo no contiene JSON válido (${detail}).`,
      unknownFormat: "formato desconocido",
      oneIssue: "Encontramos un problema en el JSON:",
      manyIssues: (count) => `Encontramos ${count} problemas en el JSON:`,
      moreIssues: (count) => `Y ${count} problemas más.`,
      generating: "Generando el PDF…",
      ready: (name) => `CV de ${name} listo. Pulsa «Descargar CV» para guardarlo.`,
      failed: "No se pudo generar el PDF. Revisa que el JSON tenga los datos del CV.",
    },
    keyboard: {
      hintBefore: "Pulsa",
      hintAfter: "para abrir la paleta de comandos",
      open: "Abrir la paleta de comandos",
      palette: "Paleta de comandos",
      search: "Buscar comando",
      commands: "Comandos",
      empty: "No se encontraron comandos",
      navigate: "navegar",
      select: "seleccionar",
      close: "cerrar",
      download: "Descargar CV (PDF)",
      print: "Imprimir",
      email: "Enviar un correo",
      phone: "Llamar por teléfono",
      visit: (network) => `Visitar ${network}`,
      actions: "Acciones",
      social: "Social",
    },
    pdf: {
      sections: {
        summary: "Perfil profesional",
        work: "Experiencia laboral",
        education: "Educación",
        skills: "Habilidades",
        projects: "Proyectos",
        certificates: "Certificaciones",
        awards: "Premios",
        publications: "Publicaciones",
        volunteer: "Voluntariado",
        languages: "Idiomas",
      },
      technologies: "Tecnologías: ",
      competencies: "Competencias: ",
    },
  },
  en: {
    languageNav: "Site language",
    languageName: "English",
    languageShort: "EN",
    present: "Present",
    meta: {
      imageAlt: (name) => `Photo of ${name}`,
      cvAlternate: (name) => `${name} - CV (PDF)`,
    },
    validation: {
      required: "is a required field and cannot be empty.",
      requiredObject: "is a required field and must be an object.",
      text: "must be text.",
      date: "must be a date in YYYY, YYYY-MM or YYYY-MM-DD format.",
      object: "must be an object.",
      list: "must be a list.",
      root: "The file must contain a JSON object with the CV data.",
    },
    sections: {
      about: "About me",
      experience: "Work experience",
      education: "Education",
      projects: "Projects",
      skills: "Skills",
    },
    hero: {
      contact: "Contact and social links",
      emailLabel: (email) => `Send an email to ${email}`,
      emailTitle: (name, email) => `Send an email to ${name} at ${email}`,
      phoneLabel: (phone) => `Call ${phone}`,
      phoneTitle: (name, phone) => `Call ${name} at ${phone}`,
      profileLabel: (network) => `${network} profile (opens in a new tab)`,
      profileTitle: (name, network) => `Visit ${name}'s profile on ${network}`,
      downloadTitle: "Download the CV as an ATS-friendly PDF",
      download: "Download CV",
      avatarAlt: (name) => `Photo of ${name}`,
    },
    experience: {
      view: (name) => `View ${name}`,
    },
    education: {
      view: (institution) => `View ${institution}`,
    },
    projects: {
      activeTitle: "Active project",
      activeLabel: "(active)",
      view: (name) => `View project ${name}`,
      sourceTitle: (name) => `View the source code of project ${name}`,
      sourceLabel: (name) => `Source code of ${name} on GitHub (opens in a new tab)`,
    },
    generator: {
      title: "Generate your CV from a JSON",
      introStart: "Upload your",
      introAfterFile: "file (in ",
      schemaLink: "JSON Resume",
      schemaLinkLabel: "JSON Resume schema (opens in a new tab)",
      introMiddle: "format) and download a PDF with the same design and ATS-friendly format as",
      myCv: "my CV",
      introEnd: ". The file is processed in your browser: it is never uploaded to a server.",
      dropTitle: "Drag your",
      dropOr: "here or click to select it",
      dropHint: "JSON Resume · 4 MB max",
      download: "Download CV",
      noscript: "You need to enable JavaScript to generate a PDF from your file.",
      fileTooLarge: "The file exceeds 4 MB. Try a smaller JSON file.",
      invalidJson: (detail) => `The file does not contain valid JSON (${detail}).`,
      unknownFormat: "unknown format",
      oneIssue: "We found one issue in the JSON:",
      manyIssues: (count) => `We found ${count} issues in the JSON:`,
      moreIssues: (count) => `And ${count} more issues.`,
      generating: "Generating the PDF…",
      ready: (name) => `CV for ${name} is ready. Click "Download CV" to save it.`,
      failed: "Could not generate the PDF. Check that the JSON contains the CV data.",
    },
    keyboard: {
      hintBefore: "Press",
      hintAfter: "to open the command palette",
      open: "Open the command palette",
      palette: "Command palette",
      search: "Search commands",
      commands: "Commands",
      empty: "No commands found",
      navigate: "navigate",
      select: "select",
      close: "close",
      download: "Download CV (PDF)",
      print: "Print",
      email: "Send an email",
      phone: "Call by phone",
      visit: (network) => `Visit ${network}`,
      actions: "Actions",
      social: "Social",
    },
    pdf: {
      sections: {
        summary: "Professional Summary",
        work: "Work Experience",
        education: "Education",
        skills: "Skills",
        projects: "Projects",
        certificates: "Certifications",
        awards: "Awards",
        publications: "Publications",
        volunteer: "Volunteer Experience",
        languages: "Languages",
      },
      technologies: "Technologies: ",
      competencies: "Competencies: ",
    },
  },
}
