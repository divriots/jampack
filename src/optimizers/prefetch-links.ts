import { createRequire } from 'node:module';
import { GlobalState } from '../state.js';
import { install_dependency } from '../utils/install-dep.js';

const require = createRequire(import.meta.url);

export async function prefetch_links_in_viewport(
  state: GlobalState,
  html_file: string,
  appendToBody: Record<string, string>
): Promise<void> {
  await install_dependency(
    state,
    html_file,
    {
      source: {
        npm_package_name: 'quicklink',
        absolute_path_to_file: '/dist',
        filename: 'quicklink.mjs',
      },
      destination: {
        folder_name: 'quicklink-2.3.0',
        code_loader: `import { listen } from "./quicklink.mjs";
    listen();`,
      },
    },
    appendToBody
  );
}
