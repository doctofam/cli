/* Copyright 2025 Doctofam LLC */

import { fail, printJson, withJson } from '@monorepool/agentfirst/output.js'
import * as commander from 'commander'

import buildQuery from './buildQuery.js'
import { bold, cyan, dim } from './formatOutput.js'
import api from './request.js'

// Read-only on purpose: doctofam/api/handlers/scopes.js has `clinics:read`
// and deliberately no `clinics:write`, and POST/PUT/DELETE /api/clinics are
// dashboard-only routes behind an operator access token.
function clinicsCommand() {
  const command = new commander.Command('clinics')
  command.description('read the clinics of your practice (clinics:read)')

  withJson(
    command
      .command('list')
      .description('list clinics (GET /api/clinics)')
      .option('-n, --limit <limit>', 'max results')
      .option('--skip <skip>', 'skip the first N results')
      .option('--fields <fields>', 'comma-separated projection of fields'),
  ).action(async options => {
    try {
      const clinics = await api.get(
        `/api/clinics${buildQuery({
          limit: options.limit,
          skip: options.skip,
          fields: options.fields,
        })}`,
      )

      if (options.json) {
        printJson(clinics)
        return
      }

      if (clinics.length === 0) {
        console.log('No clinics found')
        return
      }

      console.log(`Found ${clinics.length} clinic(s):`)
      clinics.forEach((clinic, index) => {
        const details = [clinic.city, clinic.country].filter(Boolean).join(', ')
        console.log(
          `${index + 1}. ${clinic.name || clinic._id}` +
            `${details ? ` — ${details}` : ''} (${clinic._id})`,
        )
      })
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('get <clinicId>')
      .description('raw JSON for one clinic (GET /api/clinics/:clinicId)')
      .option('--fields <fields>', 'comma-separated projection of fields'),
  ).action(async (clinicId, options) => {
    try {
      const clinic = await api.get(
        `/api/clinics/${clinicId}${buildQuery({ fields: options.fields })}`,
      )
      printJson(clinic)
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('read <clinicId>')
      .description('read one clinic formatted for the terminal'),
  ).action(async (clinicId, options) => {
    try {
      const clinic = await api.get(`/api/clinics/${clinicId}`)
      if (options.json) {
        printJson(clinic)
        return
      }
      if (!clinic) {
        console.log('Clinic not found')
        return
      }
      console.log()
      console.log(bold(clinic.name || clinic._id))
      console.log(dim(clinic._id))
      console.log()
      if (clinic.email) console.log(`${cyan('email')}  ${clinic.email}`)
      if (clinic.phone) console.log(`${cyan('phone')}  ${clinic.phone}`)
      if (clinic.address) console.log(`${cyan('address')}  ${clinic.address}`)
      if (clinic.city) console.log(`${cyan('city')}  ${clinic.city}`)
      if (clinic.country) console.log(`${cyan('country')}  ${clinic.country}`)
      if (clinic.timezone) {
        console.log(`${cyan('timezone')}  ${clinic.timezone}`)
      }
      if (clinic.currency) {
        console.log(`${cyan('currency')}  ${clinic.currency}`)
      }
      console.log()
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  return command
}

export default clinicsCommand
