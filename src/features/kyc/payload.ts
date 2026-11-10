import type { IndividualUpgradeBody } from '@/api/kyc'
import { CORPORATE_DOCUMENTS, DIRECTOR_DOCUMENTS, type CorporateDocKey, type DirectorDocKey } from './tiers'

/** One director's record. `id` is local only; it keys the list in the UI. */
export interface DirectorDetails {
  id: string
  name: string
  files: Record<DirectorDocKey, File | null>
}

export type DirectorErrors = Partial<Record<'name' | DirectorDocKey, string>>

export const emptyDirectorFiles = () =>
  DIRECTOR_DOCUMENTS.reduce((acc, doc) => ({ ...acc, [doc.key]: null }), {} as Record<DirectorDocKey, File | null>)

export const emptyCorporateDocs = () =>
  CORPORATE_DOCUMENTS.reduce((acc, doc) => ({ ...acc, [doc.key]: null }), {} as Record<CorporateDocKey, File | null>)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "1990-05-04" (date input) → "04-May-1990", the format sink sends (moment "DD-MMM-YYYY"). */
export const formatKycDate = (value?: string) => {
  if (!value) return undefined
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return undefined
  return `${String(day).padStart(2, '0')}-${MONTHS[month - 1]}-${year}`
}

/** Drops undefined and "" so the provider never receives empty strings. */
export const compact = (payload: Record<string, unknown>) => {
  Object.keys(payload).forEach(key => {
    const value = payload[key]
    if (value === undefined || value === '') delete payload[key]
  })
  return payload
}

/**
 * Individual upgrade body: only what this tier adds. bvn and nin are sent as
 * the strings typed (a NIN starting with 0 is real); an empty string would fail
 * the schema's minLength rather than being ignored.
 */
export const buildIndividualUpgradeBody = (values: IndividualUpgradeBody): IndividualUpgradeBody => {
  const body: IndividualUpgradeBody = {}
  if (values.bvn?.trim()) body.bvn = values.bvn.trim()
  if (values.nin?.trim()) body.nin = values.nin.trim()
  if (values.address?.trim()) body.address = values.address.trim()
  return body
}

/** director_0_passport, director_1_identification… zero-indexed, as the backend reads them. */
export const directorFileField = (index: number, document: string) => `director_${index}_${document}`

/**
 * Corporate Tier 2 multipart body. One JSON object per director appended under
 * the same `directors` key (the server reads them with getlist()), with names
 * and files appended in the same pass so they stay matched by position.
 */
export const buildCorporateUpgradeBody = ({ tin, documents, directors }: { tin: string; documents: Record<CorporateDocKey, File | null>; directors: DirectorDetails[] }) => {
  const form = new FormData()
  form.append('tin', tin.trim())
  for (const doc of CORPORATE_DOCUMENTS) {
    const file = documents[doc.key]
    if (file) form.append(doc.key, file)
  }
  directors.forEach((director, index) => {
    form.append('directors', JSON.stringify({ fullname: director.name.trim() }))
    for (const doc of DIRECTOR_DOCUMENTS) {
      const file = director.files[doc.key]
      if (file) form.append(directorFileField(index, doc.key), file)
    }
  })
  return form
}
