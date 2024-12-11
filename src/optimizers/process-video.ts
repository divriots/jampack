import * as cheerio from '@divriots/cheerio';
import type { GlobalState } from '../state.js';
import { install_lozad } from '../utils/install-dep.js';

export async function processVideo(
  state: GlobalState,
  htmlfile: string,
  video: cheerio.Cheerio<cheerio.Element>,
  isAboveTheFold: boolean,
  appendToBody: Record<string, string>
): Promise<void> {
  const autoplay = video.attr('autoplay');
  if (!autoplay || autoplay === '0' || autoplay === 'false') {
    // If the video is not autoplay we can postpone loading
    // if there is a poster
    if (video.attr('poster')) {
      video.attr('preload', 'none');
      return;
    }

    // TODO create poster for videos without poster
  }

  const lazyloadOptions = state.options.video.autoplay_lazyload;
  if (lazyloadOptions.when === 'never') {
    return;
  }

  if (
    lazyloadOptions.when === 'always' ||
    (lazyloadOptions.when === 'below-the-fold' && !isAboveTheFold)
  ) {
    if (lazyloadOptions.how === 'js') {
      video.attr('class', 'jampack-lozad');
      const src = video.attr('src');
      if (src) {
        video.attr('data-src', src);
        video.removeAttr('src');
      }
      await install_lozad(state, htmlfile, appendToBody);
    }
  }
}
