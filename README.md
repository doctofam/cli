# doctofam

Command-line access to your [DoctoFam](https://www.doctofam.com/) practice on
[app.doctofam.com](https://app.doctofam.com): the clinics of your practice,
their patients, the appointments in their calendars, invoices and payments, the
procedure catalog, and webhook subscriptions — the same records the dashboard
shows, through the DoctoFam REST API at `https://api.doctofam.com`.

## Install

```bash
npm install -g doctofam   # global install
npx doctofam --help       # or run without installing
```

Requires Node.js 18 or newer.

## Quick start

```bash
doctofam login                                   # choose browser or API key login
doctofam clinics list                            # the clinics of your practice
doctofam patients list --email maria@example.com # find one patient
doctofam appointments list --startTime 2026-08-01T00:00:00.000Z
```

```
Found 1 clinic(s):
1. Example Dental — Milan, IT (0123456789abcdef01234567)
```

## Patient data is medical data

Everything this CLI reads about patients, appointments, invoices and payments
is health information about real people. Read only what you need, project the
fields you use (`--fields`), keep API key secrets on a server you control, and
give each integration its own key so one can be revoked without disturbing the
others.

## Signing up

No account yet? Create one from the terminal — the generated password prints
exactly once, and the session is stored so every other command works
immediately:

```bash
doctofam signup --email founder@example.com --json
```

## Authentication

Two ways in, both stored in `~/.doctofam/`:

- **Browser** — `doctofam login --browser` opens
  [app.doctofam.com](https://app.doctofam.com) in your browser to log in with
  your DoctoFam account, then stores a token session. Tokens are refreshed
  automatically; requests carry `Authorization: Token base64(<jwt>)`.
- **API key** — `doctofam login --with-key` prompts for an API key secret with
  a masked input. Create the key in the DoctoFam dashboard, under your clinic's
  API keys. The secret is shown **once**, when the key is created, and never
  again — store it somewhere safe. It is never accepted as a command-line
  argument, so it cannot leak into your shell history. Requests carry
  `Authorization: Basic base64(<key secret>)`.

Plain `doctofam login` in a terminal asks which method to use.
`doctofam logout` deletes everything stored in `~/.doctofam/`.

**Headless / CI / agents** — export `DOCTOFAM_API_KEY=<key secret>` and skip
`login` entirely: every command reads it at request time. When several
credentials exist the precedence is: stored browser session, then stored key,
then the environment variable — a stored login always wins over an exported
key, so a globally exported `DOCTOFAM_API_KEY` never hijacks an interactive
session.

Without a terminal the CLI never hangs and never opens a browser:
`doctofam login` (and any command run without credentials) fails immediately
with exit code 1 and instructions on stderr.

An API key belongs to a single clinic, so the clinic is implied by the key and
`--clinicId` never has to be sent. A browser login covers every clinic of the
practice, so writes made with a session need `--clinicId`.

### Scopes

Each API key carries per-resource scopes: `patients:read`, `patients:write`,
`appointments:read`, `appointments:write`, `invoices:read`, `invoices:write`,
`payments:read`, `payments:write`, `procedures:read`, `procedures:write`, and
`clinics:read`. New keys start read-only; an administrator widens them in the
dashboard. There is deliberately no `clinics:write` — clinics are managed in
the dashboard, not through the API. A command hitting a scope the key lacks
fails with `403`. Requests are rate limited per key; going over the limit
returns `429`. A browser login carries your own user permissions instead of key
scopes.

Webhook subscriptions are the one resource an API key cannot reach at all —
they are managed with an operator session only (`doctofam login --browser`).

## JSON output

Every subcommand accepts `--json` and prints real, parseable JSON on stdout —
plain `JSON.stringify`, no colors. Without the flag, `list` and `read` print
human summaries. Mutations with `--json` print a small result object:
`{ "ok": true, "id": "…" }` for `add`/`update`,
`{ "ok": true, "deleted": ["…"] }` for `delete`.

Errors always go to stderr with exit code 1; with `--json` the error is a
single JSON line — `{"error":{"message":"…","status":404}}` — so stdout stays
clean for parsing.

```bash
doctofam patients list --json -n 100 | jq '.[] | {id: ._id, name, email}'
```

## Commands

### Session

```bash
doctofam signup --email founder@example.com   # create an account and log in
doctofam login                # interactive: choose browser or API key login
doctofam login --browser      # log in through app.doctofam.com
doctofam login --with-key     # prompt for an API key secret (masked)
doctofam logout               # clear everything stored in ~/.doctofam/
```

### Schema

```bash
doctofam schema                 # the whole command tree as JSON
doctofam schema patients list   # one subtree: its options and arguments
```

Machine-readable discovery of every command, option, and argument — for agents
and scripts that would otherwise scrape `--help` text.

### Clinics (read-only)

```bash
doctofam clinics list                # clinics of the practice (--fields, -n, --skip)
doctofam clinics get <clinicId>      # raw JSON for one clinic
doctofam clinics read <clinicId>     # formatted view
```

Single-clinic lookups take the 24-character hexadecimal clinic id.

### Patients

```bash
doctofam patients list                              # -n/--limit 25, --skip, --json
doctofam patients list --clinicId <clinicId>
doctofam patients list --email maria@example.com    # exact-email lookup
doctofam patients list --ids id1,id2                # several ids at once
doctofam patients list --userId <userId>
doctofam patients list --fields name,email,phone    # project fields
doctofam patients get <patientId>                   # raw JSON
doctofam patients read <patientId>                  # formatted view
doctofam patients add --name "Maria Rossi" --email maria@example.com \
  --phone +391234567890 --dateOfBirth 1986-01-31
doctofam patients update <patientId> --phone +391234567891
doctofam patients update <patientId> --body '{"healthCard":{"number":"…"}}'
doctofam patients delete <patientId...>             # one or more ids
```

Deleting a patient also deletes their anamnesis and privacy-consent forms,
their stored signatures and their avatar. It cannot be undone.

### Appointments

```bash
doctofam appointments list                          # -n/--limit 25, --skip, --json
doctofam appointments list --clinicId <clinicId> --patientId <patientId>
doctofam appointments list --startTime 2026-08-01T00:00:00.000Z \
  --endTime 2026-09-01T00:00:00.000Z               # time window
doctofam appointments list --sortField startTime --sortDirection ASC
doctofam appointments get <appointmentId>           # raw JSON
doctofam appointments read <appointmentId>          # formatted view
doctofam appointments add --startTime 2026-08-10T14:00:00.000Z \
  --endTime 2026-08-10T14:30:00.000Z --patientId <patientId>
doctofam appointments update <appointmentId> --status CANCELED
doctofam appointments delete <appointmentId...>     # one or more ids
```

Times are ISO-8601 strings. `--startTime` keeps appointments starting at or
after it; `--endTime` keeps those ending strictly before it. Appointment
`--status` accepts `SCHEDULED`, `PATIENT_ARRIVED`, `NO_SHOW`, or `CANCELED`.
Deleting an appointment also cancels its scheduled reminders.

### Invoices

```bash
doctofam invoices list --patientId <patientId>      # same filters as appointments
doctofam invoices get <invoiceId>
doctofam invoices read <invoiceId>
doctofam invoices add --patientId <patientId> --status PENDING \
  --body '{"lines":[{"name":"Check-up","price":150}]}'
doctofam invoices update <invoiceId> --status PAID
doctofam invoices delete <invoiceId...>
```

Invoice `--status` accepts `DRAFT`, `PENDING`, `PARTIALLY_PAID`, `PAID`,
`OVERDUE`, `REFUNDED`, or `UNCOLLECTIBLE`.

### Payments

```bash
doctofam payments list --patientId <patientId>      # same filters as appointments
doctofam payments get <paymentId>
doctofam payments read <paymentId>
doctofam payments add --patientId <patientId> \
  --body '{"procedures":[{"name":"Check-up","price":150}]}'
doctofam payments update <paymentId> --note "paid in cash"
doctofam payments delete <paymentId...>
```

Payment `--status` accepts `CANCELED`, `FAILED`, or `SUCCEEDED`.

### Procedures

The procedure catalog is what the practice offers and charges — not a record of
treatment given to anyone.

```bash
doctofam procedures list                            # --clinicId, --fields, --json
doctofam procedures get <procedureId>
doctofam procedures read <procedureId>
doctofam procedures add --name "Check-up" --price 150
doctofam procedures update <procedureId> --price 160
doctofam procedures delete <procedureId...>
```

### Webhooks

```bash
doctofam webhooks list                              # --clinicId, --fields, --json
doctofam webhooks get <webhookSubscriptionId>
doctofam webhooks read <webhookSubscriptionId>
doctofam webhooks add --clinicId <clinicId> --url https://example.com/hook \
  --events patient.created,appointment.created
doctofam webhooks update <webhookSubscriptionId> --active false
doctofam webhooks delete <webhookSubscriptionId...>
```

DoctoFam POSTs `patient.created`, `patient.updated`, `patient.deleted`,
`appointment.created`, `appointment.updated`, `appointment.deleted`,
`invoice.created`, `invoice.updated` and `payment.created` to the URL you
register, signed with an `X-Doctofam-Signature` header. The signing secret is
returned exactly once, by `add` — store it then. Omitting `--events` subscribes
to every event. An endpoint that fails twenty times in a row is disabled
automatically; re-enable it with `--active true`. These commands need a browser
login: API keys cannot manage webhook subscriptions.

### Skills

```bash
doctofam skills list           # names and descriptions of the bundled agent guides
doctofam skills get doctofam   # print a bundled SKILL.md to stdout
```

## Notes on writes

- Every create/update needs a `clinicId`. Pass `--clinicId`, or use an API key,
  which supplies it implicitly. On `update`, when neither is given, the CLI
  reads the record first and reuses its `clinicId` — that path needs the
  matching `:read` scope too.
- `update` sends only the fields you pass (plus `--body` JSON) and the record's
  own id; the API merges them into the stored record.
- Creates and updates fire the corresponding webhooks (`patient.created`,
  `appointment.updated`, …) for the clinic's webhook subscriptions, exactly as
  dashboard edits do.
- Deletes are permanent and accept multiple ids
  (`doctofam patients delete <id1> <id2>`).
- Reading a record that belongs to another practice answers `404`, never `403`,
  so ids cannot be probed from the outside.

## Configuration

`DOCTOFAM_API_URL` overrides the API endpoint (default
`https://api.doctofam.com`) — only needed against a non-production deployment.
`DOCTOFAM_API_KEY` supplies an API key secret from the environment for headless
use. Stored credentials live only in `~/.doctofam/`; the CLI sends them to the
DoctoFam API and nowhere else, and collects no telemetry.

## Usage with AI agents

Install the DoctoFam agent skills for Claude Code, Cursor, Codex, and any other
agent that supports the Skills standard:

```bash
npx skills add doctofam/skills
```

The same guide ships inside the npm package, version-matched to the installed
CLI:

```bash
doctofam skills list           # what is bundled
doctofam skills get doctofam   # the CLI guide matching this version
```

Or paste this into your `AGENTS.md` / `CLAUDE.md`:

```markdown
## DoctoFam

Use the `doctofam` CLI for DoctoFam data: clinics, patients, appointments,
invoices, payments and procedures. Run `npx doctofam skills get doctofam` for
the full guide, `doctofam schema` for the command tree as JSON, and
`doctofam --help` for the command reference. Log in once with `doctofam login`
(browser or API key), or export DOCTOFAM_API_KEY for headless use. Every
subcommand accepts `--json`. Patient records are medical data — read only what
the task needs.
```

Prefer raw HTTP? The same API key authenticates the REST API directly —
`https://api.doctofam.com` with `Authorization: Basic base64(<key secret>)`.
Assistants that should only see safe, non-clinical administrative data belong
on the read-only MCP connector at `https://mcp.doctofam.com/mcp` instead.

## License

[Apache-2.0](LICENSE)
