/* Copyright 2025 Doctofam LLC */
const createSessionStore = require('@monorepool/agentfirst/sessionStore.js')

// ~/.doctofam/ holds both credential kinds: the accessToken + refreshToken a
// browser login stores, and an apiKeySecret pasted through `login --with-key`.
// The directory is only created on first use — `doctofam --help` leaves
// nothing behind.
module.exports = createSessionStore({ productDirName: 'doctofam' })
