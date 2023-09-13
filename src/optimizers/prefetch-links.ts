import $state from '../state.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const folder = `/_jampack/quicklink-2.3.0`;
const file_loader = `${folder}/loader.js`;
const file_ql = `${folder}/quicklink.umd.js`;
let payloadStored = false;

export async function prefetch_links_in_viewport(): Promise<string> {
  if (!payloadStored) {
    const file_loader_full = path.join($state.dir, file_loader);
    const file_ql_full = path.join($state.dir, file_ql);

    await fs.mkdir(path.join($state.dir, folder), { recursive: true });

    // Write loader
    const quicklink_loader = `
    const s = document.createElement("script");
    s.src = "${file_ql}";
    s.addEventListener("load", () => {
        quicklink.listen();
    });
    document.body.append(s);
    `;
    await fs.writeFile(file_loader_full, quicklink_loader);

    // We don't need to store them anymore
    payloadStored = true;
  }

  return `<script async src="${file_loader}"></script>`;
}
