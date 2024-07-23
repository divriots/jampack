import swc from '@swc/core';
import * as esbuild from 'esbuild';
import { GlobalState } from '../state.js';

export async function compressJS(
  { options }: GlobalState,
  originalCode: string
): Promise<string> {
  let resultCode = originalCode;

  switch (options.js.compressor) {
    case 'esbuild':
      resultCode = (
        await esbuild.transform(originalCode, {
          minify: true,
        })
      ).code;
      break;
    case 'swc':
      resultCode = (
        await swc.minify(originalCode, {
          compress: true,
          mangle: true,
        })
      ).code;
      break;
  }
  return resultCode;
}
