import { globby } from 'globby';
import * as path from 'path';

export async function optimize(dir: string): Promise<void> {
  console.log(`Optimizing...`);
  
  const paths = await globby(path.join(dir, '**/*.{htm,html}'));
  console.log(paths);
}
