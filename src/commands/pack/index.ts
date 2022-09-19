import {Command, Flags} from '@oclif/core'
import { compress } from '../../compress';

export default class Pack extends Command {
  static description = 'Packing directory';

  static examples = [
    `$ oex hello friend --from oclif
hello friend from oclif! (./src/commands/hello/index.ts)
`,
  ];

  static flags = {
  };

  static args = [{name: 'dir', description: 'Directory to pack', required: false}];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Pack);
    
    // STEP 1 - Optimize
    // WIP

    // STEP 2 - Compress
    await compress(args);
  }
}

