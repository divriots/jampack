import {
  transform as lightcss,
  transformStyleAttribute as lightcssStyleAttribute,
} from 'lightningcss';

export async function compressCSS(
  originalCode: Buffer,
  type?: 'inline' | undefined
): Promise<Buffer> {
  // Compress with lightningcss
  let lightCSSData: Buffer | undefined = undefined;
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
    // Take original code
    // TODO catch SyntaxError and report a Warning
  }

  let resultBuffer: Buffer | undefined = undefined;
  if (lightCSSData && lightCSSData.length < originalCode.length) {
    resultBuffer = lightCSSData;
  }

  return resultBuffer || originalCode;
}
