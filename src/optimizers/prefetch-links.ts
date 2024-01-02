import $state from '../state.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const src_filename = 'quicklink.mjs';
const folder = `/_jampack/quicklink-2.3.0`;
const url_loader = `${folder}/loader.js`;

export async function prefetch_links_in_viewport(
  html_file: string
): Promise<string> {
  const path_html = path.dirname('/' + html_file);
  const quickLinkDestination = path.join($state.dir, folder, src_filename);
  const payloadStored = await fs.access(quickLinkDestination).catch(() => false)

  if (!payloadStored) {
    const path_loader = path.join($state.dir, url_loader);

    await fs.mkdir(path.join($state.dir, folder), { recursive: true });

    // Write loader
    const code_loader = `import { listen } from "./${src_filename}";
    listen();`;
    await fs.writeFile(path_loader, code_loader);

    // Write quicklink code
    const source = require.resolve(`quicklink/dist/${src_filename}`);
    await fs.copyFile(source, quickLinkDestination);
  }

  return `<script type="module" src="${path.relative(
    path_html,
    url_loader
  )}"></script>`;
}
