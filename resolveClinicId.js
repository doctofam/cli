/* Copyright 2025 Doctofam LLC */

// doctofam/api requires a clinicId on every patient / appointment / invoice /
// payment / procedure write. An API key is issued for one clinic and supplies
// it implicitly; a browser session covers the whole practice and must send it.
// On update, when the caller passed no --clinicId, reuse the clinic of the
// existing record (costs one extra read, which needs the matching :read
// scope).
module.exports = async function resolveClinicId(options, body, getExisting) {
  let clinicId = options.clinicId || body.clinicId

  if (!clinicId) {
    const existing = await getExisting()
    clinicId = existing?.clinicId
  }

  return clinicId
}
