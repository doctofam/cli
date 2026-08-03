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
const { dim, bold, cyan } = require('./formatOutput.js')

// Webhook subscriptions are the one resource here that an API key CANNOT
// reach: every /api/webhooksubscriptions route in doctofam/api is behind
// withAccessToken alone, with no withKey branch and no scope gate. Log in
// with `doctofam login --browser` first.
function webhooksCommand() {
  const command = new commander.Command('webhooks')
  command.description(
    'manage webhook subscriptions (browser login only — API keys cannot)',
  )

  withJson(
    command
      .command('list')
      .description('list webhook subscriptions (GET /api/webhooksubscriptions)')
      .option('--clinicId <clinicId>', 'only subscriptions of this clinic')
      .option('-n, --limit <limit>', 'max results')
      .option('--skip <skip>', 'skip the first N results')
      .option('--sortField <sortField>', 'sort by this field, e.g. url')
      .option('--sortDirection <sortDirection>', 'ASC or DESC (default DESC)')
      .option('--fields <fields>', 'comma-separated projection of fields'),
  ).action(async options => {
    try {
      const subscriptions = await api.get(
        `/api/webhooksubscriptions${buildQuery({
          clinicId: options.clinicId,
          limit: options.limit,
          skip: options.skip,
          sortField: options.sortField,
          sortDirection: options.sortDirection,
          fields: options.fields,
        })}`,
      )

      if (options.json) {
        printJson(subscriptions)
        return
      }

      if (subscriptions.length === 0) {
        console.log('No webhook subscriptions found')
        return
      }

      console.log(`Found ${subscriptions.length} webhook subscription(s):`)
      subscriptions.forEach((subscription, index) => {
        const state = subscription.active === false ? 'disabled' : 'active'
        console.log(
          `${index + 1}. ${subscription.url} — ${state} (${subscription._id})`,
        )
      })
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('get <webhookSubscriptionId>')
      .description(
        'raw JSON for one subscription' +
          ' (GET /api/webhooksubscriptions/:webhookSubscriptionId)',
      ),
  ).action(async (webhookSubscriptionId, options) => {
    try {
      const subscription = await api.get(
        `/api/webhooksubscriptions/${webhookSubscriptionId}`,
      )
      printJson(subscription)
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('read <webhookSubscriptionId>')
      .description('read one subscription formatted for the terminal'),
  ).action(async (webhookSubscriptionId, options) => {
    try {
      const subscription = await api.get(
        `/api/webhooksubscriptions/${webhookSubscriptionId}`,
      )
      if (options.json) {
        printJson(subscription)
        return
      }
      if (!subscription) {
        console.log('Webhook subscription not found')
        return
      }
      console.log()
      console.log(bold(subscription.url || subscription._id))
      console.log(dim(subscription._id))
      console.log()
      console.log(
        `${cyan('active')}  ${subscription.active === false ? 'false' : 'true'}`,
      )
      if (subscription.clinicId) {
        console.log(`${cyan('clinicId')}  ${subscription.clinicId}`)
      }
      console.log(
        `${cyan('events')}  ${
          subscription.events?.length ? subscription.events.join(', ') : 'all'
        }`,
      )
      if (subscription.consecutiveFailures !== undefined) {
        console.log(
          `${cyan('consecutiveFailures')}  ${subscription.consecutiveFailures}`,
        )
      }
      console.log()
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('add')
      .description(
        'create a subscription (POST /api/webhooksubscriptions) —' +
          ' the signing secret is returned exactly once, here',
      )
      .requiredOption('--url <url>', 'https endpoint that receives deliveries')
      .requiredOption('--clinicId <clinicId>', 'clinic whose events to deliver')
      .option(
        '--events <events>',
        'comma-separated event names; omit to subscribe to every event',
      )
      .option(
        '--body <json>',
        'extra JSON fields merged into the request body',
      ),
  ).action(async options => {
    try {
      const body = options.body ? parseBody(options.body) : {}
      const subscription = await api.post('/api/webhooksubscriptions', {
        ...body,
        url: options.url,
        clinicId: options.clinicId,
        ...(options.events && {
          events: options.events.split(',').filter(Boolean),
        }),
      })
      if (options.json) {
        // The secret is never retrievable again, so it is echoed here even in
        // the terse --json mutation shape.
        printJson({
          ok: true,
          id: subscription._id,
          secret: subscription.secret,
        })
        return
      }
      printJson(subscription)
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('update <webhookSubscriptionId>')
      .description(
        'update a subscription' +
          ' (PUT /api/webhooksubscriptions/:webhookSubscriptionId)',
      )
      .option('--url <url>', 'https endpoint that receives deliveries')
      .option('--events <events>', 'comma-separated event names')
      .option('--active <active>', 'true or false')
      .option(
        '--body <json>',
        'extra JSON fields merged into the request body',
      ),
  ).action(async (webhookSubscriptionId, options) => {
    try {
      const body = options.body ? parseBody(options.body) : {}
      const subscription = await api.put(
        `/api/webhooksubscriptions/${webhookSubscriptionId}`,
        {
          ...body,
          ...(options.url && { url: options.url }),
          ...(options.events && {
            events: options.events.split(',').filter(Boolean),
          }),
          ...(options.active !== undefined && {
            active: options.active !== 'false',
          }),
        },
      )
      if (options.json) {
        printJson({ ok: true, id: subscription._id })
        return
      }
      printJson(subscription)
    } catch (error) {
      fail(error, { json: options.json })
    }
  })

  withJson(
    command
      .command('delete <webhookSubscriptionId...>')
      .description(
        'delete one or more subscriptions by id' +
          ' (DELETE /api/webhooksubscriptions/:webhookSubscriptionId)',
      ),
  ).action(async (webhookSubscriptionIds, options) => {
    const deleted = []
    for (let index = 0; index < webhookSubscriptionIds.length; index += 1) {
      const webhookSubscriptionId = webhookSubscriptionIds[index]
      try {
        await api.del(`/api/webhooksubscriptions/${webhookSubscriptionId}`)
        deleted.push(webhookSubscriptionId)
        if (!options.json) {
          console.log(`deleted ${webhookSubscriptionId}`)
        }
      } catch (error) {
        fail(error, { json: options.json })
      }
    }
    if (options.json) {
      printJson({
        ok: deleted.length === webhookSubscriptionIds.length,
        deleted,
      })
    }
  })

  return command
}

module.exports = webhooksCommand
