import { Command } from 'commander';
import { compress } from './compress.js';
import { optimize } from './optimize.js';

const program = new Command();

program
  .name('jampack')
  .description('Static website Optimizer')
  .version('0.0.1');

program.parse();

program.command('pack')
  .description('todo')
  .argument('<dir>', 'Directory to pack')
  .action(async (str, options) => {
    const compressedResults = await optimize(str);
    await compress(str, compressedResults);
  });

program.parse();
