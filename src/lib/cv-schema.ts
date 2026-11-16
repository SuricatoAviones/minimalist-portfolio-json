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
import { ui, type Lang } from "@/i18n/ui"

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

type Messages = (typeof ui)[Lang]["validation"]

const isObject = (value: unknown): value is Obj =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function fail(errors: string[], path: string, message: string) {
  errors.push(`${path}: ${message}`)
}

function readString(
  value: Obj,
  key: string,
  path: string,
  errors: string[],
  m: Messages,
  required = false
) {
  const raw = value[key]
  if (raw === undefined || raw === null || raw === "") {
    if (required) fail(errors, path, m.required)
    return undefined
  }
  if (typeof raw !== "string") {
    fail(errors, path, m.text)
    return undefined
  }
  return raw.trim()
}

function readDate(
  value: Obj,
  key: string,
  path: string,
  errors: string[],
  m: Messages,
  required = false
): DateString | undefined {
  const raw = readString(value, key, path, errors, m, required)
  if (raw === undefined) return undefined
  if (!DATE_PATTERN.test(raw)) {
    fail(errors, path, m.date)
    return undefined
  }
  return raw
}

function readObject(
  value: Obj,
  key: string,
  path: string,
  errors: string[],
  m: Messages,
  required = false
): Obj | undefined {
  const raw = value[key]
  if (raw === undefined || raw === null) {
    if (required) fail(errors, path, m.requiredObject)
    return undefined
  }
  if (!isObject(raw)) {
    fail(errors, path, m.object)
    return undefined
  }
  return raw
}

function readList(value: Obj, key: string, path: string, errors: string[], m: Messages): unknown[] {
  const raw = value[key]
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) {
    fail(errors, path, m.list)
    return []
  }
  return raw
}

function readStringList(value: Obj, key: string, path: string, errors: string[], m: Messages): string[] {
  const list = readList(value, key, path, errors, m)
  return list.filter((item, index) => {
    if (typeof item === "string") return true
    fail(errors, `${path}[${index}]`, m.text)
    return false
  }) as string[]
}

/** Lee una lista de objetos y valida cada elemento con `readItem`. */
function readItems<T>(
  value: Obj,
  key: string,
  path: string,
  errors: string[],
  m: Messages,
  readItem: (item: Obj, itemPath: string, errors: string[], m: Messages) => T
): T[] {
  const list = readList(value, key, path, errors, m)
  return list.flatMap((item, index) => {
    const itemPath = `${path}[${index}]`
    if (!isObject(item)) {
      fail(errors, itemPath, m.object)
      return []
    }
    return [readItem(item, itemPath, errors, m)]
  })
}

function readBasics(value: unknown, errors: string[], m: Messages): Basics | undefined {
  if (!isObject(value)) {
    fail(errors, "basics", m.requiredObject)
    return undefined
  }

  const location = readObject(value, "location", "basics.location", errors, m) ?? {}
  const profiles = readItems<Profile>(value, "profiles", "basics.profiles", errors, m, (profile, path, errs, msg) => ({
    network: readString(profile, "network", `${path}.network`, errs, msg, true) ?? "",
    username: readString(profile, "username", `${path}.username`, errs, msg) ?? "",
    url: readString(profile, "url", `${path}.url`, errs, msg, true) ?? "",
  }))

  return {
    name: readString(value, "name", "basics.name", errors, m, true) ?? "",
    label: readString(value, "label", "basics.label", errors, m) ?? "",
    image: readString(value, "image", "basics.image", errors, m),
    email: readString(value, "email", "basics.email", errors, m),
    phone: readString(value, "phone", "basics.phone", errors, m),
    url: readString(value, "url", "basics.url", errors, m),
    summary: readString(value, "summary", "basics.summary", errors, m) ?? "",
    location: {
      address: readString(location, "address", "basics.location.address", errors, m),
      postalCode: readString(location, "postalCode", "basics.location.postalCode", errors, m),
      city: readString(location, "city", "basics.location.city", errors, m) ?? "",
      countryCode: readString(location, "countryCode", "basics.location.countryCode", errors, m),
      region: readString(location, "region", "basics.location.region", errors, m),
    },
    profiles,
  }
}

function readWork(value: Obj, path: string, errors: string[], m: Messages): Work {
  return {
    name: readString(value, "name", `${path}.name`, errors, m) ?? "",
    position: readString(value, "position", `${path}.position`, errors, m, true) ?? "",
    url: readString(value, "url", `${path}.url`, errors, m),
    location: readString(value, "location", `${path}.location`, errors, m),
    startDate: readDate(value, "startDate", `${path}.startDate`, errors, m, true) ?? "",
    endDate: readDate(value, "endDate", `${path}.endDate`, errors, m),
    summary: readString(value, "summary", `${path}.summary`, errors, m) ?? "",
    highlights: readStringList(value, "highlights", `${path}.highlights`, errors, m),
  }
}

function readVolunteer(value: Obj, path: string, errors: string[], m: Messages): Volunteer {
  return {
    organization: readString(value, "organization", `${path}.organization`, errors, m, true) ?? "",
    position: readString(value, "position", `${path}.position`, errors, m, true) ?? "",
    url: readString(value, "url", `${path}.url`, errors, m),
    startDate: readDate(value, "startDate", `${path}.startDate`, errors, m, true) ?? "",
    endDate: readDate(value, "endDate", `${path}.endDate`, errors, m),
    summary: readString(value, "summary", `${path}.summary`, errors, m) ?? "",
    highlights: readStringList(value, "highlights", `${path}.highlights`, errors, m),
  }
}

function readEducation(value: Obj, path: string, errors: string[], m: Messages): Education {
  return {
    institution: readString(value, "institution", `${path}.institution`, errors, m, true) ?? "",
    url: readString(value, "url", `${path}.url`, errors, m),
    area: readString(value, "area", `${path}.area`, errors, m, true) ?? "",
    studyType: readString(value, "studyType", `${path}.studyType`, errors, m),
    startDate: readDate(value, "startDate", `${path}.startDate`, errors, m, true) ?? "",
    endDate: readDate(value, "endDate", `${path}.endDate`, errors, m),
    score: readString(value, "score", `${path}.score`, errors, m),
    courses: readStringList(value, "courses", `${path}.courses`, errors, m),
  }
}

function readAward(value: Obj, path: string, errors: string[], m: Messages): Award {
  return {
    title: readString(value, "title", `${path}.title`, errors, m, true) ?? "",
    date: readDate(value, "date", `${path}.date`, errors, m),
    awarder: readString(value, "awarder", `${path}.awarder`, errors, m, true) ?? "",
    summary: readString(value, "summary", `${path}.summary`, errors, m),
  }
}

function readCertificate(value: Obj, path: string, errors: string[], m: Messages): Certificate {
  return {
    name: readString(value, "name", `${path}.name`, errors, m, true) ?? "",
    date: readDate(value, "date", `${path}.date`, errors, m),
    issuer: readString(value, "issuer", `${path}.issuer`, errors, m, true) ?? "",
    url: readString(value, "url", `${path}.url`, errors, m),
  }
}

function readPublication(value: Obj, path: string, errors: string[], m: Messages): Publication {
  return {
    name: readString(value, "name", `${path}.name`, errors, m, true) ?? "",
    publisher: readString(value, "publisher", `${path}.publisher`, errors, m, true) ?? "",
    releaseDate: readDate(value, "releaseDate", `${path}.releaseDate`, errors, m),
    url: readString(value, "url", `${path}.url`, errors, m),
    summary: readString(value, "summary", `${path}.summary`, errors, m),
  }
}

function readSkill(value: Obj, path: string, errors: string[], m: Messages): Skill {
  return {
    name: readString(value, "name", `${path}.name`, errors, m, true) ?? "",
    level: readString(value, "level", `${path}.level`, errors, m),
    keywords: readStringList(value, "keywords", `${path}.keywords`, errors, m),
  }
}

function readLanguage(value: Obj, path: string, errors: string[], m: Messages): Language {
  return {
    language: readString(value, "language", `${path}.language`, errors, m, true) ?? "",
    fluency: readString(value, "fluency", `${path}.fluency`, errors, m, true) ?? "",
  }
}

function readInterest(value: Obj, path: string, errors: string[], m: Messages): Interest {
  return {
    name: readString(value, "name", `${path}.name`, errors, m, true) ?? "",
    keywords: readStringList(value, "keywords", `${path}.keywords`, errors, m),
  }
}

function readReference(value: Obj, path: string, errors: string[], m: Messages): Reference {
  return {
    name: readString(value, "name", `${path}.name`, errors, m, true) ?? "",
    reference: readString(value, "reference", `${path}.reference`, errors, m, true) ?? "",
  }
}

function readProject(value: Obj, path: string, errors: string[], m: Messages): Project {
  return {
    name: readString(value, "name", `${path}.name`, errors, m, true) ?? "",
    isActive: typeof value.isActive === "boolean" ? value.isActive : undefined,
    description: readString(value, "description", `${path}.description`, errors, m) ?? "",
    highlights: readStringList(value, "highlights", `${path}.highlights`, errors, m),
    url: readString(value, "url", `${path}.url`, errors, m),
    github: readString(value, "github", `${path}.github`, errors, m),
  }
}

/** Valida y normaliza un CV en formato JSON Resume. */
export function validateCv(data: unknown, lang: Lang = "es"): CvValidation {
  const m = ui[lang].validation

  if (!isObject(data)) {
    return { ok: false, errors: [m.root] }
  }

  const errors: string[] = []
  const basics = readBasics(data.basics, errors, m)

  const cv: CV = {
    basics: basics ?? {
      name: "",
      label: "",
      summary: "",
      location: { city: "" },
      profiles: [],
    },
    work: readItems<Work>(data, "work", "work", errors, m, readWork),
    volunteer: readItems<Volunteer>(data, "volunteer", "volunteer", errors, m, readVolunteer),
    education: readItems<Education>(data, "education", "education", errors, m, readEducation),
    awards: readItems<Award>(data, "awards", "awards", errors, m, readAward),
    certificates: readItems<Certificate>(data, "certificates", "certificates", errors, m, readCertificate),
    publications: readItems<Publication>(data, "publications", "publications", errors, m, readPublication),
    skills: readItems<Skill>(data, "skills", "skills", errors, m, readSkill),
    languages: readItems<Language>(data, "languages", "languages", errors, m, readLanguage),
    interests: readItems<Interest>(data, "interests", "interests", errors, m, readInterest),
    references: readItems<Reference>(data, "references", "references", errors, m, readReference),
    projects: readItems<Project>(data, "projects", "projects", errors, m, readProject),
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, cv }
}
