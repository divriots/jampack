import { Stats } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { optimize as svgo } from "svgo";
import { minify as htmlminifier } from 'html-minifier-terser';
import { minify as csso } from "csso";
import { formatBytes } from './utils.js';
import { table, TableUserConfig } from 'table';
import sharp from 'sharp';
import swc from '@swc/core';
import type { Result } from './types.js';

type Summary = {
  nbFiles: number;
  nbFilesCompressed: number;
  dataLenUncompressed: number;
  dataLenCompressed: number;
}

type State = {
  total: Summary;
  detailsByExtension: Record<string, Summary>;
}

let state: State;
let compressedFiles: string[] = [];

const beginProgress = (initResults: Result[]): void => {
  state = {
    total: {
      nbFiles: 0,
      nbFilesCompressed: 0,
      dataLenUncompressed: 0,
      dataLenCompressed: 0
    },
    detailsByExtension: {},
  }

  initResults.forEach( r=> {
    addProgress(r);
    compressedFiles.push(r.file);
   } );
}

const addProgress = (r: Result): void => {
  const isCompressed = r.compressedSize < r.originalSize ? 1 : 0;

  state.total.nbFiles++;
  state.total.nbFilesCompressed += isCompressed;
  state.total.dataLenUncompressed += r.originalSize;
  state.total.dataLenCompressed += r.compressedSize;
  
  const ext = path.extname(r.file);
  if(ext) {
    var summary = state.detailsByExtension[ext];
    if (!summary) {
      summary = {
        nbFiles: 0,
        nbFilesCompressed: 0,
        dataLenUncompressed: 0,
        dataLenCompressed: 0
      }
      state.detailsByExtension[ext] = summary;
    }
    summary.nbFiles++;
    summary.nbFilesCompressed += isCompressed;
    summary.dataLenUncompressed += r.originalSize;
    summary.dataLenCompressed += r.compressedSize;
  }
}

const printProgress = (r: Result): void => {
  addProgress(r);
  const msg = `${state.total.nbFiles} files | ${formatBytes(state.total.dataLenUncompressed)} → ${formatBytes(state.total.dataLenCompressed)}`;
  if (!process.stdout.cursorTo) {
    // In CI we don't have access to cursorTo
    console.log(msg);
  }
  else {
    process.stdout.cursorTo(0);
    process.stdout.write(msg); 
  }
}

const endProgress = (): void => {
  process.stdout.write('\n');
}

const printDetails = () => {
  const dataTable: any[] = [['Extension', 'Files', 'Compressed', 'Original', 'Compressed', 'Gain']];
  const config: TableUserConfig = {
    columns: [
      { alignment: 'left' },
      { alignment: 'right' },
      { alignment: 'right' },
      { alignment: 'right' },
      { alignment: 'right' }
    ],
  };

  Object.entries(state.detailsByExtension).forEach(([ext, summary]) => {
    if (summary.dataLenCompressed < summary.dataLenUncompressed) {
      const row = [ ext, summary.nbFiles, summary.nbFilesCompressed, formatBytes(summary.dataLenUncompressed), formatBytes(summary.dataLenCompressed), '-'+formatBytes(summary.dataLenUncompressed - summary.dataLenCompressed) ];
      dataTable.push(row);  
    }
  });
  const total = [ 'Total', state.total.nbFiles, state.total.nbFilesCompressed, formatBytes(state.total.dataLenUncompressed), formatBytes(state.total.dataLenCompressed), '-'+formatBytes(state.total.dataLenUncompressed - state.total.dataLenCompressed)];
  dataTable.push(total);

  console.log(table(dataTable, config));
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
    console.error(e);
  }

  // Writedata
  if (writeData && writeData.length < result.originalSize) {
    result.compressedSize = writeData.length;
    await fs.writeFile(file, writeData);
  }

  printProgress(result);

  return result;
}

export const compressImage = async (data: Buffer, resize: sharp.ResizeOptions ): Promise<Buffer | undefined> => {

  const sharpFile = await sharp(data);
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
      return await sharpFile.resize(resize).toBuffer();
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
                if (compressedFiles.includes(filePath)) {
                  return [];
                }
                return [await processFile(filePath, stats)];
            }
        })
    );
    return files.filter((file) => file.length).flat(1); // Remove empty dir and flat it all
};

export async function compress(dir: string, initResult: Result[]): Promise<void> {  
  beginProgress(initResult);
  await processDirectory(dir);
  endProgress();

  printDetails();
}
