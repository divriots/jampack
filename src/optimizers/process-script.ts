import * as cheerio from '@divriots/cheerio';
import type { GlobalState } from '../state.js';

export async function processScript(
  state: GlobalState,
  htmlfile: string,
  script: cheerio.Cheerio<cheerio.Element>,
  isAboveTheFold: boolean,
  appendToBody: Record<string, string>
): Promise<void> {
  const src = script.attr('src');
  const type = script.attr('type');
  const async = script.attr('async');
  const defer = script.attr('defer');
  const innerHTML = script.html();

  console.log('Script tag data:', {
    file: htmlfile,
    src: src || '(inline)',
    type: type || '(no type)',
    async: async !== undefined ? 'true' : 'false',
    defer: defer !== undefined ? 'true' : 'false',
    isAboveTheFold,
    hasInlineContent: innerHTML ? innerHTML.length > 0 : false,
    inlineContentLength: innerHTML ? innerHTML.length : 0
  });
}