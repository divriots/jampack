import { minify as csso } from 'csso';
import {
  transform as lightcss,
  transformStyleAttribute as lightcssStyleAttribute,
} from 'lightningcss';

export async function compressCSS(
  originalCode: Buffer,
  type?: 'inline' | undefined
): Promise<Buffer> {
  // csso only support css files. No inline style
  let cssoCSSData: Buffer | undefined = undefined;
  if (type !== 'inline') {
    // Compress with csso
    cssoCSSData = Buffer.from(
      await csso(originalCode.toString(), { comments: false }).css
    );
  }

  // Compress with lightningcss
  let lightCSSData;
  try {
    const options = {
      code: originalCode,
      minify: true,
      sourceMap: false,
    };
    if (type === 'inline') {
      lightCSSData = lightcssStyleAttribute(options).code;
    } else {
      lightCSSData = lightcss({ filename: 'style.css', ...options }).code;
    }
  } catch (e) {
    // Error while processing with lightningcss
    // Ignore, we have csso as backup
  }

  let resultBuffer: Buffer | undefined = undefined;

  // Pick the best
  if (cssoCSSData && lightCSSData) {
    resultBuffer =
      cssoCSSData.length <= lightCSSData.length ? cssoCSSData : lightCSSData;
  } else if (cssoCSSData && !lightCSSData) {
    resultBuffer = cssoCSSData;
  } else if (!cssoCSSData && lightCSSData) {
    resultBuffer = lightCSSData;
  }

  return resultBuffer || originalCode;
}
