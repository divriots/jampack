#!/usr/bin/env node

import { Command } from 'commander';
import { compress } from './compress.js';
import { optimize } from './optimize.js';

const program = new Command();

program
  .name('jampack')
  .description('Static website Optimizer')
  .version('0.0.1');

program.command('pack', { isDefault: true})
  .description('todo')
  .argument('<dir>', 'Directory to pack')
  .action(async (str, options) => {
    console.log(`PASS 1 - Optimizing...`);
    const compressedResults = await optimize(str);
    console.log(`PASS 2 - Compressing...`);
    await compress(str, compressedResults);
  });

program.parse();
