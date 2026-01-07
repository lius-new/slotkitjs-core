#!/usr/bin/env node

/**
 * SlotKit CLI Entry Point
 */

import { Command } from 'commander'
import { dev } from './commands/dev'
import { build } from './commands/build'
import { preview } from './commands/preview'
import { generateImports } from './commands/generate-imports'
import { createPlugin } from './commands/create-plugin'
import { list } from './commands/list'
import { enable } from './commands/enable'
import { disable } from './commands/disable'

const program = new Command()

program
  .name('slotkit')
  .description('SlotKit - A dynamic plugin system framework')
  .version('0.1.0')

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port to run dev server on', '5173')
  .action(dev)

program
  .command('build')
  .description('Build the project')
  .action(build)

program
  .command('preview')
  .description('Preview the built project')
  .option('-p, --port <port>', 'Port to run preview server on', '4173')
  .action(preview)

program
  .command('generate-imports')
  .description('Generate plugin import mappings')
  .action(generateImports)

program
  .command('create-plugin <name>')
  .description('Create a new plugin')
  .option('--slots <slots>', 'Comma-separated list of slots', 'content')
  .option('--author <author>', 'Plugin author', 'Plugin Developer')
  .option('--description <description>', 'Plugin description')
  .action(createPlugin)

program
  .command('list')
  .description('List all plugins')
  .action(list)

program
  .command('enable <id>')
  .description('Enable a plugin')
  .action(enable)

program
  .command('disable <id>')
  .description('Disable a plugin')
  .action(disable)

program.parse()

