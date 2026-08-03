/* Copyright 2025 Doctofam LLC */
const commander = require('commander')
const {
  printJson,
  withJson,
  fail,
} = require('@monorepool/agentfirst/output.js')
const buildQuery = require('./buildQuery.js')
const parseBody = require('./parseBody.js')
const api = require('./request.js')
const resolveClinicId = require('./resolveClinicId.js')
const { dim, bold, cyan } = require('./formatOutput.js')

// The procedure catalog: what the practice offers and charges. Not a record
// of treatment given to anyone.
function proceduresCommand() {
  const command = new commander.Command('procedures')
  command.description(
    'manage the procedure catalog of your clinic' +
      ' (procedures:read / procedures:write)',
  )

  withJson(
    command
      .command('list')
      .description('list procedures (GET /api/procedures)')
      .option('--clinicId <clinicId>', 'only procedures of this clinic')
      .option('--patientId <patientId>', 'only procedures of this patient')
      .option('-n, --limit <limit>', 'max results', '25')
      .option('--skip <skip>', 'skip the first N results')
      .option('--sortField <sortField>', 'sort by this field, e.g. name')
      .option('--sortDirection <sortDirection>', 'ASC or DESC (default DESC)')
      .option('--fields <fields>', 'comma-separated projection of fields'),
  ).action(async options => {
    try {
      const procedures = await api.get(
        `/api/procedures${buildQuery({
          clinicId: options.clinicId,
          patientId: options.patientId,
          limit: options.limit,
          skip: options.skip,
          sortField: options.sortField,
          sortDirection: options.sortDirection,
          fields: options.fields,
        })}`,
      )

      if (options.json) {
        printJson(procedures)
        return
      }

      if (procedures.length === 0) {
        console.log('No procedures found')
        return
      }

      console.log(`Found ${procedures.length} procedure(s):`)
      procedures.forEach((procedure, index) => {
        const price =
          procedure.price === undefined ? null : `${procedure.price}`
        console.log(
          `${index + 1}. ${procedure.name || procedure._id}` +
            `${price ? ` — ${price}` : ''} (${procedure._id})`,
        )
      })
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('get <procedureId>')
      .description(
        'raw JSON for one procedure (GET /api/procedures/:procedureId)',
      ),
  ).action(async (procedureId, options) => {
    try {
      const procedure = await api.get(`/api/procedures/${procedureId}`)
      printJson(procedure)
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('read <procedureId>')
      .description('read one procedure formatted for the terminal'),
  ).action(async (procedureId, options) => {
    try {
      const procedure = await api.get(`/api/procedures/${procedureId}`)
      if (options.json) {
        printJson(procedure)
        return
      }
      if (!procedure) {
        console.log('Procedure not found')
        return
      }
      console.log()
      console.log(bold(procedure.name || procedure._id))
      console.log(dim(procedure._id))
      console.log()
      if (procedure.price !== undefined) {
        console.log(`${cyan('price')}  ${procedure.price}`)
      }
      if (procedure.color) console.log(`${cyan('color')}  ${procedure.color}`)
      if (procedure.clinicId) {
        console.log(`${cyan('clinicId')}  ${procedure.clinicId}`)
      }
      console.log()
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('add')
      .description('create a procedure (POST /api/procedures)')
      .requiredOption('--name <name>', 'procedure name')
      .option('--price <price>', 'price, as a number')
      .option('--color <color>', 'hex color used in the calendar, e.g. #EC407A')
      .option(
        '--clinicId <clinicId>',
        'clinic the procedure belongs to (implied by an API key)',
      )
      .option(
        '--body <json>',
        'extra JSON fields merged into the request body',
      ),
  ).action(async options => {
    try {
      const body = options.body ? parseBody(options.body) : {}
      const procedure = await api.post('/api/procedures', {
        ...body,
        name: options.name,
        ...(options.price !== undefined && { price: Number(options.price) }),
        ...(options.color && { color: options.color }),
        ...(options.clinicId && { clinicId: options.clinicId }),
      })
      if (options.json) {
        printJson({ ok: true, id: procedure._id })
        return
      }
      printJson(procedure)
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('update <procedureId>')
      .description('update a procedure (PUT /api/procedures/:procedureId)')
      .option('--name <name>', 'procedure name')
      .option('--price <price>', 'price, as a number')
      .option('--color <color>', 'hex color used in the calendar, e.g. #EC407A')
      .option('--clinicId <clinicId>', 'clinic the procedure belongs to')
      .option(
        '--body <json>',
        'extra JSON fields merged into the request body',
      ),
  ).action(async (procedureId, options) => {
    try {
      const body = options.body ? parseBody(options.body) : {}
      const clinicId = await resolveClinicId(options, body, () =>
        api.get(`/api/procedures/${procedureId}`),
      )
      const procedure = await api.put(`/api/procedures/${procedureId}`, {
        ...body,
        _id: procedureId,
        ...(clinicId && { clinicId }),
        ...(options.name && { name: options.name }),
        ...(options.price !== undefined && { price: Number(options.price) }),
        ...(options.color && { color: options.color }),
      })
      if (options.json) {
        printJson({ ok: true, id: procedure._id })
        return
      }
      printJson(procedure)
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('delete <procedureId...>')
      .description(
        'delete one or more procedures by id' +
          ' (DELETE /api/procedures/:procedureId)',
      ),
  ).action(async (procedureIds, options) => {
    const deleted = []
    for (let index = 0; index < procedureIds.length; index += 1) {
      const procedureId = procedureIds[index]
      try {
        await api.del(`/api/procedures/${procedureId}`)
        deleted.push(procedureId)
        if (!options.json) {
          console.log(`deleted ${procedureId}`)
        }
      } catch (error) {
        fail(error, { json: options.json })
      }
    }
    if (options.json) {
      printJson({ ok: deleted.length === procedureIds.length, deleted })
    }
  })

  return command
}

module.exports = proceduresCommand
