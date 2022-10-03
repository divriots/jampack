import { Stats } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { optimize as svgo } from "svgo";
import { minify as htmlminifier } from 'html-minifier-terser';
import { minify as csso } from "csso";
import { formatBytes } from './utils.js';
import sharp from 'sharp';
import swc from '@swc/core';
import globalState, { Result } from './state.js';

const beginProgress = (): void => {
}

const addProgress = (r: Result): void => {
  const isCompressed = r.compressedSize < r.originalSize ? 1 : 0;

  globalState.summary.nbFiles++;
  globalState.summary.nbFilesCompressed += isCompressed;
  globalState.summary.dataLenUncompressed += r.originalSize;
  globalState.summary.dataLenCompressed += r.compressedSize;
  
  const ext = path.extname(r.file);
  if(ext) {
    var summary = globalState.summaryByExtension[ext];
    if (!summary) {
      summary = {
        nbFiles: 0,
        nbFilesCompressed: 0,
        dataLenUncompressed: 0,
        dataLenCompressed: 0
      }
      globalState.summaryByExtension[ext] = summary;
    }
    summary.nbFiles++;
    summary.nbFilesCompressed += isCompressed;
    summary.dataLenUncompressed += r.originalSize;
    summary.dataLenCompressed += r.compressedSize;
  }
}

const printProgress = (r: Result): void => {
  addProgress(r);
  const msg = `${globalState.summary.nbFiles} files | ${formatBytes(globalState.summary.dataLenUncompressed)} → ${formatBytes(globalState.summary.dataLenCompressed)}`;
  if (!process.stdout.clearLine || !process.stdout.cursorTo) {
    // In CI we don't have access to clearLine or cursorTo
    console.log(msg);
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

const processFile = async (file: string, stats: Stats): Promise<Result> => {
  const result = {
    file,
    originalSize: stats.size,
    compressedSize: stats.size
  }

  let writeData: Buffer | string | undefined = undefined;

  try {
    const ext = path.extname(file);

    switch(ext) {
      case '.svg':
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp':
      case '.gif':
        const newImageData = await compressImageFile(file);
        if (newImageData && newImageData.length < result.originalSize) {
          writeData = newImageData;
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

  // Writedata
  if (writeData && writeData.length < result.originalSize) {
    result.compressedSize = writeData.length;
    if (!globalState.args.nowrite) {
      await fs.writeFile(file, writeData);
    }
  }

  printProgress(result);

  return result;
}

export const compressImage = async (data: Buffer, resize: sharp.ResizeOptions ): Promise<Buffer | undefined> => {

  const sharpFile = await sharp(data, { animated: true });
  const meta = await sharpFile.metadata();

  switch(meta.format) {
    case 'svg':
      const newData = svgo(data, {});
      if (newData.error || newData.modernError) {
        console.log( `Error processing svg ${data}`);
        return undefined;
      }
      return Buffer.from(newData.data, 'utf8');
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'gif':
      return await sharpFile.resize( {...resize, withoutEnlargement: true} ).toBuffer();
  }

  return undefined;
}

const compressImageFile = async (file: string): Promise<Buffer | string | undefined> => {
  const buffer = await fs.readFile(file);
  return compressImage(buffer, {});
}

const processDirectory = async (directoryPath: string): Promise<Result[]> => {
    const filesInDirectory = await fs.readdir(directoryPath);
    const files = await Promise.all(
        filesInDirectory.map(async (file: string) => {
            const filePath = path.join(directoryPath, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isDirectory()) {
                return processDirectory(filePath);
            } else {
                if (globalState.compressedFiles.includes(filePath)) {
                  return [];
                }
                return [await processFile(filePath, stats)];
            }
        })
    );
    return files.filter((file) => file.length).flat(1); // Remove empty dir and flat it all
};

export async function compress(): Promise<void> {  
  beginProgress();
  await processDirectory(globalState.dir);
  endProgress();
}
