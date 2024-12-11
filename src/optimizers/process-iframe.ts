import * as cheerio from '@divriots/cheerio';
import type { GlobalState } from '../state.js';
import { install_dependency, install_lozad } from '../utils/install-dep.js';

export async function processIframe(
  state: GlobalState,
  htmlfile: string,
  iframe: cheerio.Cheerio<cheerio.Element>,
  isAboveTheFold: boolean,
  appendToBody: Record<string, string>
): Promise<void> {
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
        await install_lozad(state, htmlfile, appendToBody);
      }
    }
  }
}
