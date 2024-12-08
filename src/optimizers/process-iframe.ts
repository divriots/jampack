import * as cheerio from '@divriots/cheerio';
import type { GlobalState } from '../state.js';
import { install_dependency } from '../utils/install-dep.js';

export async function processIframe(
  state: GlobalState,
  htmlfile: string,
  $: cheerio.CheerioAPI,
  imgElement: cheerio.Element,
  isAboveTheFold: boolean,
  appendToBody: Record<string, string>
): Promise<void> {
  const iframe = $(imgElement);

  // Reset loading attribute
  iframe.removeAttr('loading');

  const lazyloadOptions = state.options.iframe.lazyload;
  if (lazyloadOptions.when === 'never') {
    return;
  }

  if (
    lazyloadOptions.when === 'always' ||
    (lazyloadOptions.when === 'below-the-fold' && !isAboveTheFold)
  ) {
    if (lazyloadOptions.how === 'native') {
      iframe.attr('loading', 'lazy');
    } else if (lazyloadOptions.how === 'js') {
      const src = iframe.attr('src');
      if (src) {
        iframe.attr('class', 'jampack-lozad');
        iframe.attr('data-src', src);
        iframe.removeAttr('src');
        await install_dependency(
          state,
          htmlfile,
          {
            source: {
              npm_package_name: 'lozad',
              absolute_path_to_file: '/dist',
              filename: 'lozad.es.js',
            },
            destination: {
              folder_name: 'lozad-1.16',
              code_loader: `import lozad from "./lozad.es.js";
            const observer = lozad('.jampack-lozad', { rootMargin: '100px 0px', threshold: [0.1] });
            observer.observe();`,
            },
          },
          appendToBody
        );
      }
    }
  }
}
