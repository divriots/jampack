#!/usr/bin/env node

import { Command } from 'commander';
import { compress } from './compress.js';
import { optimize } from './optimize.js';
import { Result } from './types.js';

const program = new Command();

program
  .name('jampack')
  .description('Static website Optimizer')
  .version('0.0.1');

program.command('pack', { isDefault: true})
  .description('todo')
  .argument('<dir>', 'Directory to pack')
  .option('--nowrite', 'No write')
  .option('--onlycompress', 'Only compress')
  .option('--onlyoptim', 'Only optimize')
  .action(async (str, options) => {
    let compressedResults: Result[] = [];

    if (!options.onlycompress) {
      console.log(`PASS 1 - Optimizing...`);
      compressedResults = await optimize(str);  
    } 
    
    if (!options.onlyoptim) {
      console.log(`PASS 2 - Compressing...`);
      await compress(str, compressedResults);  
    }
  });

program.parse();
