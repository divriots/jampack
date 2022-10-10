import { Stats } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { optimize as svgo } from "svgo";
import { minify as htmlminifier } from 'html-minifier-terser';
import { minify as csso } from "csso";
import { formatBytes } from './utils.js';
import sharp from 'sharp';
import swc from '@swc/core';
import globalState, { ReportItem } from './state.js';
import { globby } from 'globby';
import options, { WebpOptions } from './options.js';
import type { Image, ImageFormat } from './types.js';

const beginProgress = (): void => {
}

const printProgress = (): void => {
  const gain = globalState.summary.dataLenUncompressed-globalState.summary.dataLenCompressed;
  const msg = `${globalState.summary.nbFiles} files | ${formatBytes(globalState.summary.dataLenUncompressed)} → ${formatBytes(globalState.summary.dataLenCompressed)} | -${formatBytes(gain)} `;
  if (!process.stdout.clearLine || !process.stdout.cursorTo) {
    // In CI we don't have access to clearLine or cursorTo
    // Just don't log any progress
  }
  else {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(msg);
  }
}

const endProgress = (): void => {
  process.stdout.write('\n');
}

const processFile = async (file: string, stats: Stats): Promise<void> => {

  let writeData: Buffer | string | undefined = undefined;

  try {
    const ext = path.extname(file);

    switch(ext) {
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.svg':
      case '.webp':
        const newImage = await compressImageFile(file);
        if (newImage?.data && newImage.data.length < stats.size) {
          writeData = newImage.data;
        }
        break;
      case '.html':
      case '.htm':
          const htmldata = await fs.readFile(file);
          const newhtmlData = await htmlminifier(htmldata.toString(), { minifyCSS: true, minifyJS: true, sortClassName: true, sortAttributes: true});
          writeData = newhtmlData;
          break;
      case '.css':
        const cssdata = await fs.readFile(file);
        const newcssData = await csso(cssdata.toString()).css;
        if (newcssData) {
          writeData = newcssData;
        }
        break;
      case '.js':
        const jsdata = await fs.readFile(file);
        const newjsresult = await swc.minify(jsdata.toString(), { compress: true, mangle: true });
        if (newjsresult.code && newjsresult.code.length < jsdata.length) {
          writeData = newjsresult.code;
        }
        break;
    }
  }
  catch(e) {
    // console error for the moment
    console.error(`\n${file}`);
    console.error(e);
  }

  const result: ReportItem = {
    action: path.extname(file),
    originalSize: stats.size,
    compressedSize: stats.size
  }

  // Writedata
  if (writeData && writeData.length < result.originalSize) {
    result.compressedSize = writeData.length;
    
    if (!globalState.args.nowrite) {
      await fs.writeFile(file, writeData);
    }
  }

  globalState.compressedFiles.add(file);
  globalState.reportItem(result);

  printProgress();
}

function createWebpOptions( opt: WebpOptions | undefined ): sharp.WebpOptions {
  return {
      nearLossless: opt?.mode === 'lossless',
      quality: opt?.quality || 80,
      effort: opt?.effort || 4
   }
}

export const compressImage = async (data: Buffer, resize: sharp.ResizeOptions, toWebp: boolean = false ): Promise<Image | undefined> => {

  let sharpFile = await sharp(data, { animated: true });
  const meta = await sharpFile.metadata();

  if (meta.pages && meta.pages > 1) {
    // Skip animated images for the moment.
    return undefined;
  }

  let doSharp = false;
  let outputFormat: ImageFormat;

  switch(meta.format) {
    case 'svg':
      const newData = svgo(data, {
        multipass: true,
        plugins: [ {
          name: "preset-default",
          params: {
            overrides: {
              removeViewBox: false,
            },
          },
          }
        ],
      });
      if (newData.error || newData.modernError) {
        console.log( `Error processing svg ${data}`);
        return undefined;
      }
      return { format: 'svg', data: Buffer.from(newData.data, 'utf8') };
    case 'png':
      outputFormat = 'png';
      if (!toWebp) {
        sharpFile = sharpFile.png(options.image.png.options || {});
      }     
      doSharp = true;
      break;
    case 'jpeg':
    case 'jpg':
      outputFormat = 'jpg';
      if (!toWebp) {
        sharpFile = sharpFile.jpeg(options.image.jpeg.options || {});
      }
      doSharp = true;
      break;
    case 'webp':
      outputFormat = 'webp';
      sharpFile = sharpFile.webp( createWebpOptions(options.image.webp.options_lossly) || {});
      doSharp = true;
      toWebp = false; // Don't need to convert to webP again
      break;
  }

  if (doSharp) {
    if (toWebp) {
      sharpFile = sharpFile.webp( createWebpOptions(meta.format==='png' ? options.image.webp.options_lossless : options.image.webp.options_lossly));
      outputFormat = 'webp';
    }
    if (resize.width && resize.height) {
      sharpFile = sharpFile.resize( {...resize, fit: 'fill', withoutEnlargement: true} );
    }
    return { format: outputFormat, data: await sharpFile.toBuffer()};
  }

  return undefined;
}

const compressImageFile = async (file: string, toWebP: boolean = false): Promise<Image | undefined> => {
  const buffer = await fs.readFile(file);
  return compressImage(buffer, {}, toWebP);
}

export async function compress(exclude: string): Promise<void> {  
  beginProgress();

  const globs = ['**/**'];
  if (exclude) globs.push('!'+exclude);
  const paths = await globby(globs, { cwd: globalState.dir, absolute: true });

  // "Parallel" processing
  await Promise.all(paths.map(async file => {
    if (!globalState.compressedFiles.has(file)) {
      await processFile(file, await fs.stat(file));
    }
  }));

  endProgress();
}
