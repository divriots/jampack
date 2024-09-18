#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import { compressFolder } from './compress.js';
import { optimize } from './optimize.js';
import { GlobalState } from './state.js';
import { table, TableUserConfig } from 'table';
import { formatBytes } from './utils.js';
import { fast, loadConfig } from './config.js';
import { printTitle } from './logger.js';
import { exit } from 'process';
import kleur from 'kleur';
import { cleanCache } from './cache.js';
import { VERSION } from './packagejson.js';
import { mkdirSync } from 'fs';
import { join } from 'path';

const logo = `     __                                    __    
    |__|____    _____ ___________    ____ |  | __
    |  \\__  \\  /     \\\\____ \\__  \\ _/ ___\\|  |/ /
    |  |/ __ \\|  Y Y  \\  |_> > __ \\\\  \\___|    < 
/\\__|  (____  /__|_|  /   __(____  /\\___  >__|_ \\
\\______|    \\/      \\/|  |       \\/     \\/     \\/
 v${VERSION.padEnd(14)}      |__| by ‹div›RIOTS
`;

console.log(logo);

const program = new Command();

program
  .name('jampack')
  .description('Static website Optimizer')
  .version(VERSION);

program
  .command('pack', { isDefault: true })
  .description('todo')
  .argument('<dir>', 'Directory to pack')
  .option('--include <include>', 'Glob to include')
  .option('--exclude <exclude>', 'Glob to exclude')
  .option('--nowrite', 'No write')
  .option('--fast', 'Go fast. Mostly no compression just checks for issues.')
  .option('--fail', 'Exits with a non-zero return code if issues.')
  .option('--onlyoptim', 'Only optimize (PASS 1).')
  .option('--onlycomp', 'Only compress (PASS 2).')
  .option('--cache_folder <cache_folder>', 'Default: .jampack/cache')
  .option(
    '--sequential_compress',
    'Whether to perform folder compression sequentially. Reduces memoru footprint on compress. Default: false'
  )
  .option('--cleancache', 'Clean cache before running')
  .option('--nocache', 'Run with no use of cache')
  .action(async (dir, options) => {
    const state = new GlobalState();

    // Arguments
    state.dir = dir;
    state.args = options;

    // Print options
    if (options) {
      console.log('Options:');
      console.log(options);
      console.log('');
    }

    // Override default config with config file
    await loadConfig(state);

    // Override config with fast options if set
    if (options.fast) {
      fast(state);
    }

    // Clean cache
    await cleanCache(state, options.cleancache);

    // Make _jampack folder
    try {
      mkdirSync(join(dir, '_jampack'));
    } catch (e) {
      console.error(
        'Folder `_jampack` is present in target folder. This means that jampack has already processed this folder. You should always run jampack on clean build of the static website.'
      );
      exit(1);
    }

    if (!options.onlycomp) {
      printTitle('PASS 1 - Optimizing');
      console.time('Done');
      await optimize(state, options.include, options.exclude);
      console.timeEnd('Done');
    }

    if (!options.onlyoptim && !options.fast) {
      printTitle('PASS 2 - Compressing the rest');
      console.time('Done');
      await compressFolder(state, options.exclude);
      console.timeEnd('Done');
    }

    printSummary(state);

    printIssues(state);

    if (options.fail && state.issues.size > 0) {
      exit(1);
    }
  });

program.parse();

function printSummary($state: GlobalState) {
  if ($state.summary.nbFiles > 0) {
    printTitle('Summary');

    const dataTable: any[] = [
      ['Action', 'Compressed', 'Original', 'Compressed', 'Gain'],
    ];
    const config: TableUserConfig = {
      columns: [
        { alignment: 'left' },
        { alignment: 'right' },
        { alignment: 'right' },
        { alignment: 'right' },
        { alignment: 'right' },
      ],
      drawHorizontalLine: (lineIndex, rowCount) => {
        return (
          lineIndex === 0 ||
          lineIndex === 1 ||
          lineIndex === rowCount - 1 ||
          lineIndex === rowCount
        );
      },
    };

    const unCompressedDataRows: any[] = [];

    Object.entries($state.summaryByExtension).forEach(([ext, summary]) => {
      const gain = summary.dataLenUncompressed - summary.dataLenCompressed;

      const row = [
        ext,
        `${summary.nbFilesCompressed} / ${summary.nbFiles}`,
        formatBytes(summary.dataLenUncompressed),
        formatBytes(summary.dataLenCompressed),

        gain > 0 ? '-' + formatBytes(gain) : '',
      ];

      if (gain > 0) {
        dataTable.push(row);
      } else {
        unCompressedDataRows.push(row);
      }
    });

    // Add uncompress rows at the end
    dataTable.push(...unCompressedDataRows);

    const total = [
      'Total',
      `${$state.summary.nbFilesCompressed} / ${$state.summary.nbFiles}`,
      formatBytes($state.summary.dataLenUncompressed),
      formatBytes($state.summary.dataLenCompressed),
      '-' +
        formatBytes(
          $state.summary.dataLenUncompressed - $state.summary.dataLenCompressed
        ),
    ];
    dataTable.push(total);

    console.log(table(dataTable, config));
  }
}

function printIssues(state: GlobalState) {
  let issueCount = 0;

  if (state.issues.size === 0) {
    printTitle('✔ No issues');
  } else {
    printTitle('Issues', kleur.bgRed);
    console.log('');
    for (let [file, list] of state.issues) {
      console.log('▶ ' + file + '\n');
      list.forEach((issue) => {
        issueCount++;
        console.log(`${kleur.bgYellow(` ${issue.type} `)} ${issue.msg}\n`);
      });
    }
    printTitle(
      `${issueCount} issue(s) over ${state.issues.size} files`,
      kleur.bgYellow
    );
    console.log('');
  }
}
