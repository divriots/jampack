import swc from '@swc/core';

export async function compressJS(originalCode: string): Promise<string> {
  const newjsresult = await swc.minify(originalCode, {
    compress: true,
    mangle: true,
  });
  return newjsresult.code;
}
