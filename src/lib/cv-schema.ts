import type {
  Award,
  Basics,
  CV,
  Certificate,
  DateString,
  Education,
  Interest,
  Language,
  Profile,
  Project,
  Publication,
  Reference,
  Skill,
  Volunteer,
  Work,
} from "@/types/cv"

/*
 * Validación del JSON que sube el usuario desde la web (esquema JSON Resume).
 * - Comprueba el tipo de todos los campos conocidos y avisa con la ruta exacta
 *   (`work[1].startDate`), para que el error sea fácil de localizar.
 * - Normaliza los campos opcionales para que el generador del PDF nunca reciba
 *   `undefined` donde espera una lista.
 * - No depende de Node: se ejecuta igual en el navegador y en el build.
 */

export type CvValidation = { ok: true; cv: CV } | { ok: false; errors: string[] }

type Obj = Record<string, unknown>

const DATE_PATTERN = /^\d{4}(-\d{2}(-\d{2})?)?$/

const isObject = (value: unknown): value is Obj =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function fail(errors: string[], path: string, message: string) {
  errors.push(`${path}: ${message}`)
}

function readString(value: Obj, key: string, path: string, errors: string[], required = false) {
  const raw = value[key]
  if (raw === undefined || raw === null || raw === "") {
    if (required) fail(errors, path, "es un campo obligatorio y no puede estar vacío.")
    return undefined
  }
  if (typeof raw !== "string") {
    fail(errors, path, "debe ser texto.")
    return undefined
  }
  return raw.trim()
}

function readDate(value: Obj, key: string, path: string, errors: string[], required = false): DateString | undefined {
  const raw = readString(value, key, path, errors, required)
  if (raw === undefined) return undefined
  if (!DATE_PATTERN.test(raw)) {
    fail(errors, path, "debe ser una fecha con formato AAAA, AAAA-MM o AAAA-MM-DD.")
    return undefined
  }
  return raw
}

function readObject(value: Obj, key: string, path: string, errors: string[], required = false): Obj | undefined {
  const raw = value[key]
  if (raw === undefined || raw === null) {
    if (required) fail(errors, path, "es un campo obligatorio y debe ser un objeto.")
    return undefined
  }
  if (!isObject(raw)) {
    fail(errors, path, "debe ser un objeto.")
    return undefined
  }
  return raw
}

function readList(value: Obj, key: string, path: string, errors: string[]): unknown[] {
  const raw = value[key]
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) {
    fail(errors, path, "debe ser una lista.")
    return []
  }
  return raw
}

function readStringList(value: Obj, key: string, path: string, errors: string[]): string[] {
  const list = readList(value, key, path, errors)
  return list.filter((item, index) => {
    if (typeof item === "string") return true
    fail(errors, `${path}[${index}]`, "debe ser texto.")
    return false
  }) as string[]
}

/** Lee una lista de objetos y valida cada elemento con `readItem`. */
function readItems<T>(
  value: Obj,
  key: string,
  path: string,
  errors: string[],
  readItem: (item: Obj, itemPath: string, errors: string[]) => T
): T[] {
  const list = readList(value, key, path, errors)
  return list.flatMap((item, index) => {
    const itemPath = `${path}[${index}]`
    if (!isObject(item)) {
      fail(errors, itemPath, "debe ser un objeto.")
      return []
    }
    return [readItem(item, itemPath, errors)]
  })
}

function readBasics(value: unknown, errors: string[]): Basics | undefined {
  if (!isObject(value)) {
    fail(errors, "basics", "es un campo obligatorio y debe ser un objeto.")
    return undefined
  }

  const location = readObject(value, "location", "basics.location", errors) ?? {}
  const profiles = readItems<Profile>(value, "profiles", "basics.profiles", errors, (profile, path, errs) => ({
    network: readString(profile, "network", `${path}.network`, errs, true) ?? "",
    username: readString(profile, "username", `${path}.username`, errs) ?? "",
    url: readString(profile, "url", `${path}.url`, errs, true) ?? "",
  }))

  return {
    name: readString(value, "name", "basics.name", errors, true) ?? "",
    label: readString(value, "label", "basics.label", errors) ?? "",
    image: readString(value, "image", "basics.image", errors),
    email: readString(value, "email", "basics.email", errors),
    phone: readString(value, "phone", "basics.phone", errors),
    url: readString(value, "url", "basics.url", errors),
    summary: readString(value, "summary", "basics.summary", errors) ?? "",
    location: {
      address: readString(location, "address", "basics.location.address", errors),
      postalCode: readString(location, "postalCode", "basics.location.postalCode", errors),
      city: readString(location, "city", "basics.location.city", errors) ?? "",
      countryCode: readString(location, "countryCode", "basics.location.countryCode", errors),
      region: readString(location, "region", "basics.location.region", errors),
    },
    profiles,
  }
}

function readWork(value: Obj, path: string, errors: string[]): Work {
  return {
    name: readString(value, "name", `${path}.name`, errors) ?? "",
    position: readString(value, "position", `${path}.position`, errors, true) ?? "",
    url: readString(value, "url", `${path}.url`, errors),
    location: readString(value, "location", `${path}.location`, errors),
    startDate: readDate(value, "startDate", `${path}.startDate`, errors, true) ?? "",
    endDate: readDate(value, "endDate", `${path}.endDate`, errors),
    summary: readString(value, "summary", `${path}.summary`, errors) ?? "",
    highlights: readStringList(value, "highlights", `${path}.highlights`, errors),
  }
}

function readVolunteer(value: Obj, path: string, errors: string[]): Volunteer {
  return {
    organization: readString(value, "organization", `${path}.organization`, errors, true) ?? "",
    position: readString(value, "position", `${path}.position`, errors, true) ?? "",
    url: readString(value, "url", `${path}.url`, errors),
    startDate: readDate(value, "startDate", `${path}.startDate`, errors, true) ?? "",
    endDate: readDate(value, "endDate", `${path}.endDate`, errors),
    summary: readString(value, "summary", `${path}.summary`, errors) ?? "",
    highlights: readStringList(value, "highlights", `${path}.highlights`, errors),
  }
}

function readEducation(value: Obj, path: string, errors: string[]): Education {
  return {
    institution: readString(value, "institution", `${path}.institution`, errors, true) ?? "",
    url: readString(value, "url", `${path}.url`, errors),
    area: readString(value, "area", `${path}.area`, errors, true) ?? "",
    studyType: readString(value, "studyType", `${path}.studyType`, errors),
    startDate: readDate(value, "startDate", `${path}.startDate`, errors, true) ?? "",
    endDate: readDate(value, "endDate", `${path}.endDate`, errors),
    score: readString(value, "score", `${path}.score`, errors),
    courses: readStringList(value, "courses", `${path}.courses`, errors),
  }
}

function readAward(value: Obj, path: string, errors: string[]): Award {
  return {
    title: readString(value, "title", `${path}.title`, errors, true) ?? "",
    date: readDate(value, "date", `${path}.date`, errors),
    awarder: readString(value, "awarder", `${path}.awarder`, errors, true) ?? "",
    summary: readString(value, "summary", `${path}.summary`, errors),
  }
}

function readCertificate(value: Obj, path: string, errors: string[]): Certificate {
  return {
    name: readString(value, "name", `${path}.name`, errors, true) ?? "",
    date: readDate(value, "date", `${path}.date`, errors),
    issuer: readString(value, "issuer", `${path}.issuer`, errors, true) ?? "",
    url: readString(value, "url", `${path}.url`, errors),
  }
}

function readPublication(value: Obj, path: string, errors: string[]): Publication {
  return {
    name: readString(value, "name", `${path}.name`, errors, true) ?? "",
    publisher: readString(value, "publisher", `${path}.publisher`, errors, true) ?? "",
    releaseDate: readDate(value, "releaseDate", `${path}.releaseDate`, errors),
    url: readString(value, "url", `${path}.url`, errors),
    summary: readString(value, "summary", `${path}.summary`, errors),
  }
}

function readSkill(value: Obj, path: string, errors: string[]): Skill {
  return {
    name: readString(value, "name", `${path}.name`, errors, true) ?? "",
    level: readString(value, "level", `${path}.level`, errors),
    keywords: readStringList(value, "keywords", `${path}.keywords`, errors),
  }
}

function readLanguage(value: Obj, path: string, errors: string[]): Language {
  return {
    language: readString(value, "language", `${path}.language`, errors, true) ?? "",
    fluency: readString(value, "fluency", `${path}.fluency`, errors, true) ?? "",
  }
}

function readInterest(value: Obj, path: string, errors: string[]): Interest {
  return {
    name: readString(value, "name", `${path}.name`, errors, true) ?? "",
    keywords: readStringList(value, "keywords", `${path}.keywords`, errors),
  }
}

function readReference(value: Obj, path: string, errors: string[]): Reference {
  return {
    name: readString(value, "name", `${path}.name`, errors, true) ?? "",
    reference: readString(value, "reference", `${path}.reference`, errors, true) ?? "",
  }
}

function readProject(value: Obj, path: string, errors: string[]): Project {
  return {
    name: readString(value, "name", `${path}.name`, errors, true) ?? "",
    isActive: typeof value.isActive === "boolean" ? value.isActive : undefined,
    description: readString(value, "description", `${path}.description`, errors) ?? "",
    highlights: readStringList(value, "highlights", `${path}.highlights`, errors),
    url: readString(value, "url", `${path}.url`, errors),
    github: readString(value, "github", `${path}.github`, errors),
  }
}

/** Valida y normaliza un CV en formato JSON Resume. */
export function validateCv(data: unknown): CvValidation {
  if (!isObject(data)) {
    return { ok: false, errors: ["El archivo debe contener un objeto JSON con los datos del CV."] }
  }

  const errors: string[] = []
  const basics = readBasics(data.basics, errors)

  const cv: CV = {
    basics: basics ?? {
      name: "",
      label: "",
      summary: "",
      location: { city: "" },
      profiles: [],
    },
    work: readItems<Work>(data, "work", "work", errors, readWork),
    volunteer: readItems<Volunteer>(data, "volunteer", "volunteer", errors, readVolunteer),
    education: readItems<Education>(data, "education", "education", errors, readEducation),
    awards: readItems<Award>(data, "awards", "awards", errors, readAward),
    certificates: readItems<Certificate>(data, "certificates", "certificates", errors, readCertificate),
    publications: readItems<Publication>(data, "publications", "publications", errors, readPublication),
    skills: readItems<Skill>(data, "skills", "skills", errors, readSkill),
    languages: readItems<Language>(data, "languages", "languages", errors, readLanguage),
    interests: readItems<Interest>(data, "interests", "interests", errors, readInterest),
    references: readItems<Reference>(data, "references", "references", errors, readReference),
    projects: readItems<Project>(data, "projects", "projects", errors, readProject),
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, cv }
}
