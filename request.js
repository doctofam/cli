/* Copyright 2025 Doctofam LLC */
const createRequest = require('@monorepool/agentfirst/request.js')
const getApiUrl = require('./getApiUrl.js')
const session = require('./session.js')
const { binaryName, envKeyName } = require('./constants.js')

// Dual-mode transport from @monorepool/agentfirst:
//
//   token mode — `Authorization: Token base64(jwt)` after a browser login,
//                with a single refresh against /api/refresh-access-token on
//                a 401
//   key mode   — `Authorization: Basic base64(<key secret>)` from the stored
//                secret or the DOCTOFAM_API_KEY environment variable, which
//                is exactly what doctofam/api's withKey.js expects: the
//                secret alone, with no `user:` prefix. API keys are
//                long-lived secrets, so there is no refresh.
//
// Credential precedence lives in agentfirst's resolveCredential.js: stored
// session > stored key > environment key. Errors carry `.status` and `.body`,
// and end with the login hint (naming both `doctofam login` and
// DOCTOFAM_API_KEY) when the caller never authenticated.
module.exports = createRequest({ getApiUrl, session, envKeyName, binaryName })
