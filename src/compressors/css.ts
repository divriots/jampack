import browserslist from 'browserslist';
import {
  browserslistToTargets,
  transform as lightcss,
  transformStyleAttribute as lightcssStyleAttribute,
} from 'lightningcss';
import { GlobalState } from '../state.js';

export const defaultTargets = () =>
  browserslistToTargets(browserslist('defaults'));

export async function compressCSS(
  { targets }: GlobalState,
  originalCode: Buffer,
  type?: 'inline' | undefined
): Promise<Buffer> {
  // Compress with lightningcss
  let lightCSSData: Uint8Array | undefined = undefined;
  try {
    const options = {
      code: originalCode,
      minify: true,
      sourceMap: false,
      targets,
    };
    if (type === 'inline') {
      lightCSSData = lightcssStyleAttribute(options).code;
    } else {
      lightCSSData = lightcss({
        filename: 'style.css',
        ...options,
      }).code;
    }
  } catch (e) {
    // Error while processing with lightningcss
    // Take original code
    // TODO catch SyntaxError and report a Warning
  }

  let resultBuffer: Buffer | undefined = undefined;
  if (lightCSSData && lightCSSData.length < originalCode.length) {
    resultBuffer = Buffer.from(lightCSSData);
  }

  return resultBuffer || originalCode;
}

export function loadConfigCSS(state: GlobalState): void {
  const { options } = state;
}
