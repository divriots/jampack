import * as cheerio from '@divriots/cheerio';
import type { GlobalState } from '../state.js';

export async function processScript(
  state: GlobalState,
  htmlfile: string,
  script: cheerio.Cheerio<cheerio.Element>,
  isAboveTheFold: boolean,
  appendToBody: Record<string, string>
): Promise<void> {
  const deferOptions = state.options.js.defer;

  // Skip if defer is disabled
  if (
    deferOptions.when === 'never' ||
    (deferOptions.when === 'below-the-fold' && isAboveTheFold)
  ) {
    return;
  }

  // Skip if script already has async or defer attributes
  const existingAsync = script.attr('async');
  const existingDefer = script.attr('defer');
  if (existingAsync !== undefined || existingDefer !== undefined) {
    return;
  }

  // Skip module scripts - they are deferred by default
  const type = script.attr('type');
  if (type === 'module') {
    return;
  }

  const src = script.attr('src');
  const innerHTML = script.html();

  // Check if script matches defer patterns
  let shouldDefer = false;

  // For external scripts, check src patterns
  if (src && deferOptions.src_include.length > 0) {
    shouldDefer = deferOptions.src_include.some(pattern => !!src.match(pattern));
  }

  // For inline scripts, check content patterns
  if (!shouldDefer && innerHTML && deferOptions.content_include.length > 0) {
    shouldDefer = deferOptions.content_include.some(pattern => { console.log("============== Checking script content: ", pattern, innerHTML); return !!innerHTML.match(pattern); });
  }

  if (shouldDefer) {
    script.attr('defer', '');;
  }
}