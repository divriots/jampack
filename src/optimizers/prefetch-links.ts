import $state from '../state.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as url from 'url';

const src_filename = 'quicklink.mjs';
const folder = `/_jampack/quicklink-2.3.0`;
const url_loader = `${folder}/loader.js`;
const url_quicklink = `${folder}/${src_filename}`;
let payloadStored = false;

export async function prefetch_links_in_viewport(
  html_file: string
): Promise<string> {
  const path_html = path.dirname('/' + html_file);

  if (!payloadStored) {
    const path_loader = path.join($state.dir, url_loader);

    await fs.mkdir(path.join($state.dir, folder), { recursive: true });

    // Write loader
    const code_loader = `import { listen } from "./quicklink.mjs";
    listen();`;
    await fs.writeFile(path_loader, code_loader);

    // Write quicklink code
    const source = path.join(
      path.dirname(url.fileURLToPath(import.meta.url)),
      `../../node_modules/quicklink/dist/${src_filename}`
    );
    await fs.copyFile(source, path.join($state.dir, folder, src_filename));

    // We don't need to store them anymore
    payloadStored = true;
  }

  return `<script type="module" src="${path.relative(
    path_html,
    url_loader
  )}"></script>`;
}
