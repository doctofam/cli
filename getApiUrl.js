/* Copyright 2025 Doctofam LLC */

// Production DoctoFam API. Override with DOCTOFAM_API_URL for a
// non-production deployment.
module.exports = function getApiUrl() {
  return process.env.DOCTOFAM_API_URL || 'https://api.doctofam.com'
}
