import swc from '@swc/core';
import * as esbuild from 'esbuild';
import config from '../config.js';

export async function compressJS(originalCode: string): Promise<string> {
  let resultCode = originalCode;

  switch (config.js.compressor) {
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
