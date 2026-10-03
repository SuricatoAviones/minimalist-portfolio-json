/**
 * Tipos del CV basados en el estándar JSON Resume (https://jsonresume.org/schema).
 * Las fechas aceptan los formatos `YYYY`, `YYYY-MM` o `YYYY-MM-DD`.
 */

export type DateString = string

export interface Location {
  address?: string
  postalCode?: string
  city: string
  countryCode?: string
  region?: string
}

export interface Profile {
  network: string
  username: string
  url: string
}

export interface Basics {
  name: string
  label: string
  image?: string
  email?: string
  phone?: string
  url?: string
  summary: string
  location: Location
  profiles: Profile[]
}

export interface Work {
  name: string
  position: string
  url?: string
  location?: string
  startDate: DateString
  endDate?: DateString | null
  summary: string
  highlights: string[]
}

export interface Volunteer {
  organization: string
  position: string
  url?: string
  startDate: DateString
  endDate?: DateString | null
  summary: string
  highlights: string[]
}

export interface Education {
  institution: string
  url?: string
  area: string
  studyType?: string
  startDate: DateString
  endDate?: DateString | null
  score?: string
  courses?: string[]
}

export interface Award {
  title: string
  date?: DateString
  awarder: string
  summary?: string
}

export interface Certificate {
  name: string
  date?: DateString
  issuer: string
  url?: string
}

export interface Publication {
  name: string
  publisher: string
  releaseDate?: DateString
  url?: string
  summary?: string
}

export interface Skill {
  name: string
  level?: string
  keywords: string[]
}

export interface Language {
  language: string
  fluency: string
}

export interface Interest {
  name: string
  keywords: string[]
}

export interface Reference {
  name: string
  reference: string
}

export interface Project {
  name: string
  isActive?: boolean
  description: string
  highlights: string[]
  url?: string
  github?: string
}

export interface CV {
  basics: Basics
  work: Work[]
  volunteer: Volunteer[]
  education: Education[]
  awards: Award[]
  certificates: Certificate[]
  publications: Publication[]
  skills: Skill[]
  languages: Language[]
  interests: Interest[]
  references: Reference[]
  projects: Project[]
}
