/* Copyright 2025 Doctofam LLC */

// The per-product configuration every @monorepool/agentfirst factory needs.
//
// DOCTOFAM_API_KEY is read from the environment at request time; a stored
// login (browser session or pasted key) always wins over it, so a globally
// exported key cannot silently hijack an interactive session.
export const binaryName = 'doctofam'

export const appUrl = 'https://app.doctofam.com'
export const envKeyName = 'DOCTOFAM_API_KEY'
