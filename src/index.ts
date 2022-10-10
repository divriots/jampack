#!/usr/bin/env node

import { Command } from 'commander';
import { compress } from './compress.js';
import { optimize } from './optimize.js';
import kleur from 'kleur';
import globalState from './state.js';
import { table, TableUserConfig } from 'table';
import { formatBytes } from './utils.js';
import { exit } from 'process';

const logo = `     __                                    __    
    |__|____    _____ ___________    ____ |  | __
    |  \\__  \\  /     \\\\____ \\__  \\ _/ ___\\|  |/ /
    |  |/ __ \\|  Y Y  \\  |_> > __ \\\\  \\___|    < 
/\\__|  (____  /__|_|  /   __(____  /\\___  >__|_ \\
\\______|    \\/      \\/|  |       \\/     \\/     \\/
                      |__| by ‹div›RIOTS (c)2022
`;

console.log(logo);

const program = new Command();

program
  .name('jampack')
  .description('Static website Optimizer')
  .version('0.0.1');

program.command('pack', { isDefault: true})
  .description('todo')
  .argument('<dir>', 'Directory to pack')
  .option('--exclude <exclude>', 'Glob to exclude')
  .option('--nowrite', 'No write')
  .option('--onlycomp', 'Only compress')
  .option('--onlyoptim', 'Only optimize')
  .action(async (dir, options) => {

    globalState.dir = dir;
    globalState.args = options;

    if (!options.onlycomp) {
      console.log('');
      console.log(kleur.bgGreen(kleur.black(` PASS 1 - Optimizing `)));
      await optimize(options.exclude);
    } 
    
    if (!options.onlyoptim) {
      console.log('');
      console.log(kleur.bgGreen(kleur.black(` PASS 2 - Compressing the rest`)));
      await compress(options.exclude);
    }
    printDetails();
  });

program.parse();
function printDetails() {
  const dataTable: any[] = [['Action', 'Compressed', 'Original', 'Compressed', 'Gain']];
  const config: TableUserConfig = {
    columns: [
      { alignment: 'left' },
      { alignment: 'right' },
      { alignment: 'right' },
      { alignment: 'right' },
      { alignment: 'right' }
    ],
  };

  Object.entries(globalState.summaryByExtension).forEach(([ext, summary]) => {
    if (summary.dataLenCompressed < summary.dataLenUncompressed) {
      const row = [ ext,  `${summary.nbFilesCompressed} / ${summary.nbFiles}`, formatBytes(summary.dataLenUncompressed), formatBytes(summary.dataLenCompressed), '-'+formatBytes(summary.dataLenUncompressed - summary.dataLenCompressed) ];
      dataTable.push(row);  
    }
  });
  const total = [ 'Total', `${globalState.summary.nbFilesCompressed} / ${globalState.summary.nbFiles}`, formatBytes(globalState.summary.dataLenUncompressed), formatBytes(globalState.summary.dataLenCompressed), '-'+formatBytes(globalState.summary.dataLenUncompressed - globalState.summary.dataLenCompressed)];
  dataTable.push(total);

  console.log(table(dataTable, config));
}
