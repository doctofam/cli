#!/usr/bin/env node
/* Copyright 2025 Doctofam LLC */
const program = require('commander')
const skillsCommand = require('@monorepool/agentfirst/skillsCommand.js')
const appointmentsCommand = require('./appointmentsCommand.js')
const clinicsCommand = require('./clinicsCommand.js')
const invoicesCommand = require('./invoicesCommand.js')
const loginCommand = require('./loginCommand.js')
const logoutCommand = require('./logoutCommand.js')
const patientsCommand = require('./patientsCommand.js')
const paymentsCommand = require('./paymentsCommand.js')
const proceduresCommand = require('./proceduresCommand.js')
const schemaCommand = require('./schemaCommand.js')
const signupCommand = require('./signupCommand.js')
const webhooksCommand = require('./webhooksCommand.js')
const packageJson = require('./package.json')

program
  .name('doctofam')
  .description(
    'doctofam cli — manage the clinics, patients, appointments, invoices,' +
      ' payments and procedures of your practice from the terminal',
  )
  .version(packageJson.version)
  .addCommand(signupCommand())
  .addCommand(loginCommand())
  .addCommand(logoutCommand())
  .addCommand(clinicsCommand())
  .addCommand(patientsCommand())
  .addCommand(appointmentsCommand())
  .addCommand(invoicesCommand())
  .addCommand(paymentsCommand())
  .addCommand(proceduresCommand())
  .addCommand(webhooksCommand())
  // baseDirectory must be this file's directory: the shared factory resolves
  // the bundled skills/ relative to it (dist/index.js → ../skills).
  .addCommand(skillsCommand({ baseDirectory: __dirname }))

// `schema` describes the assembled program, itself included, so it is added
// after every other command is registered and before parsing.
program.addCommand(schemaCommand(program))
program.parse(process.argv)
