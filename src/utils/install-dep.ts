import * as fs from 'fs/promises';
import * as path from 'path';
import { createRequire } from 'node:module';
import { GlobalState } from '../state.js';

const require = createRequire(import.meta.url);

export async function install_dependency(
  state: GlobalState,
  html_file: string,
  options: {
    source: {
      npm_package_name: string;
      absolute_path_to_file: string;
      filename: string;
    };
    destination: {
      folder_name: string;
      code_loader: string;
    };
  },
  appendToBody: Record<string, string>
): Promise<void> {
  const path_html = path.dirname('/' + html_file);
  const folder = `/_jampack/${options.destination.folder_name}`;
  const src_filename = options.source.filename;
  const url_loader = `${folder}/loader.js`;

  // Install dependency in /_jampack if not done yet
  if (!state.installed_dependencies.has(options.source.npm_package_name)) {
    const quickLinkDestination = path.join(state.dir, folder, src_filename);

    const path_loader = path.join(state.dir, url_loader);

    await fs.mkdir(path.join(state.dir, folder), { recursive: true });

    // Write loader
    const code_loader = options.destination.code_loader;
    await fs.writeFile(path_loader, code_loader);

    // Write quicklink code
    const source = require.resolve(
      `${options.source.npm_package_name}${options.source.absolute_path_to_file}/${src_filename}`
    );
    await fs.copyFile(source, quickLinkDestination);

    state.installed_dependencies.add(options.source.npm_package_name);
  }

  // Add custom code to the end of body if not done yet
  if (!(options.source.npm_package_name in appendToBody)) {
    appendToBody[
      options.source.npm_package_name
    ] = `<script type="module" src="${path.relative(
      path_html,
      url_loader
    )}"></script>`;
  }
}
