import { minify } from 'html-minifier-terser';
import { compressCSS } from './css.js';
import { compressJS } from './js.js';
import config from '../config.js';

async function minifyJSinHTML(originalCode: string): Promise<string> {
  const newCode = await compressJS(originalCode);
  if (newCode && newCode.length < originalCode.length) return newCode;
  return originalCode;
}

async function minifyCSSinHTML(
  originalCode: string,
  type: 'inline' | 'media' | undefined
): Promise<string> {
  // Don't compress media
  if (type === 'media') return originalCode;

  const originalBuffer = Buffer.from(originalCode);
  const newCSS = await compressCSS(originalBuffer, type);
  if (newCSS && newCSS.length > 0 && newCSS.length < originalBuffer.length)
    return newCSS.toString();
  return originalCode;
}

export async function compressHTML(originalCode: Buffer): Promise<Buffer> {
  const newhtmlData = await minify(originalCode.toString(), {
    minifyCSS: minifyCSSinHTML,
    minifyJS: minifyJSinHTML,
    sortClassName: true,
    sortAttributes: config.html.sort_attributes,
  });

  if (newhtmlData) return Buffer.from(newhtmlData, 'utf-8');

  return originalCode;
}
