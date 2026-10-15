/* Copyright 2025 Doctofam LLC */
import createSessionStore from '@monorepool/agentfirst/sessionStore.js'

// ~/.doctofam/ holds both credential kinds: the accessToken + refreshToken a
// browser login stores, and an apiKeySecret pasted through `login --with-key`.
// The directory is only created on first use — `doctofam --help` leaves
// nothing behind.
export default createSessionStore({ productDirName: 'doctofam' })
