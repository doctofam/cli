/* Copyright 2025 Doctofam LLC */
import logoutCommand from '@monorepool/agentfirst/logoutCommand.js'

import { binaryName, envKeyName } from './constants.js'
import session from './session.js'

// Clears everything stored in ~/.doctofam/ — the API key secret and any
// browser-login tokens. A key exported as DOCTOFAM_API_KEY stays in effect;
// the shared factory says so instead of silently staying authenticated.
export default () => logoutCommand({ binaryName, session, envKeyName })
