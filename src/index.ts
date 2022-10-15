#!/usr/bin/env node

import { Command } from 'commander';
import { compress } from './compress.js';
import { optimize } from './optimize.js';
import $state from './state.js';
import { table, TableUserConfig } from 'table';
import { formatBytes } from './utils.js';
import { fast } from './config.js';
import { printTitle } from './logger.js';
import { exit } from 'process';
import kleur from 'kleur';

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
  .option('--fast', 'Go fast. Mostly no compression just checks for issues.')
  .option('--fail', 'Exits with a non-zero return code if issues.')
  .option('--onlyoptim', 'Only optimize (PASS 1).')
  .option('--onlycomp', 'Only compress (PASS 2).')
  .action(async (dir, options) => {

    $state.dir = dir;
    $state.args = options;

    // Override config with fast options
    if (options.fast) {
      fast();
    }

    if (!options.onlycomp) {
      printTitle('PASS 1 - Optimizing');
      console.time('Done');
      await optimize(options.exclude);
      console.timeEnd('Done');
    } 
    
    if (!options.onlyoptim && !options.fast) {
      printTitle('PASS 2 - Compressing the rest');
      console.time('Done');
      await compress(options.exclude);
      console.timeEnd('Done');
    }

    printSummary();

    printIssues();

    if (options.failOnIssues && $state.issues.size>0) {
      exit(1);
    }

  });

program.parse();

function printSummary() {

  if ($state.summary.nbFiles > 0) {
    printTitle('Summary');

    const dataTable: any[] = [['Action', 'Compressed', 'Original', 'Compressed', 'Gain']];
    const config: TableUserConfig = {
      columns: [
        { alignment: 'left' },
        { alignment: 'right' },
        { alignment: 'right' },
        { alignment: 'right' },
        { alignment: 'right' }
      ],
      drawHorizontalLine: (lineIndex, rowCount) => {
        return lineIndex === 0 || lineIndex === 1 || lineIndex === rowCount - 1 || lineIndex === rowCount;
      }
    };

    Object.entries($state.summaryByExtension).forEach(([ext, summary]) => {
      if (summary.dataLenCompressed < summary.dataLenUncompressed) {
        const row = [ ext,  `${summary.nbFilesCompressed} / ${summary.nbFiles}`, formatBytes(summary.dataLenUncompressed), formatBytes(summary.dataLenCompressed), '-'+formatBytes(summary.dataLenUncompressed - summary.dataLenCompressed) ];
        dataTable.push(row);  
      }
    });
    const total = [ 'Total', `${$state.summary.nbFilesCompressed} / ${$state.summary.nbFiles}`, formatBytes($state.summary.dataLenUncompressed), formatBytes($state.summary.dataLenCompressed), '-'+formatBytes($state.summary.dataLenUncompressed - $state.summary.dataLenCompressed)];
    dataTable.push(total);

    console.log(table(dataTable, config));
  }
  
}

function printIssues() {

  let issueCount = 0;

  if ($state.issues.size === 0) {
    printTitle('✔ No issues');
  }
  else
  {
    printTitle('Issues', kleur.bgRed);
    console.log('');
    for (let [file, list] of $state.issues) {
      console.log(kleur.red('▶ '+file+'\n'));
      list.forEach( issue => {
        issueCount++;
        console.log(`❌ ${issue.msg}\n`);
      })
    }

    console.log('');
    printTitle(`${issueCount} issue(s) over ${$state.issues.size} files`, kleur.bgRed);
  }

} 