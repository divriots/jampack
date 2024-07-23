import { minify } from 'html-minifier-terser';
import { compressCSS } from './css.js';
import { compressJS } from './js.js';
import { GlobalState } from '../state.js';

async function minifyJSinHTML(
  state: GlobalState,
  originalCode: string
): Promise<string> {
  const newCode = await compressJS(state, originalCode);
  if (newCode && newCode.length < originalCode.length) return newCode;
  return originalCode;
}

async function minifyCSSinHTML(
  state: GlobalState,
  originalCode: string,
  type: string | undefined
): Promise<string> {
  // Don't compress media
  if (type !== undefined && type !== 'inline') return originalCode;

  const originalBuffer = Buffer.from(originalCode);
  const newCSS = await compressCSS(state, originalBuffer, type);
  if (newCSS && newCSS.length > 0 && newCSS.length < originalBuffer.length)
    return newCSS.toString();
  return originalCode;
}

export async function compressHTML(
  state: GlobalState,
  originalCode: Buffer
): Promise<Buffer> {
  const newhtmlData = await minify(originalCode.toString(), {
    minifyCSS: (text, type) => minifyCSSinHTML(state, text, type),
    minifyJS: (text) => minifyJSinHTML(state, text),
    sortClassName: true,
    sortAttributes: state.options.html.sort_attributes,
  });

  if (newhtmlData) return Buffer.from(newhtmlData, 'utf-8');

  return originalCode;
}
