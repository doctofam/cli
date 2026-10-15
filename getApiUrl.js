/* Copyright 2025 Doctofam LLC */

// Production DoctoFam API. Override with DOCTOFAM_API_URL for a
// non-production deployment.
export default function getApiUrl() {
  return process.env.DOCTOFAM_API_URL || 'https://api.doctofam.com'
}
