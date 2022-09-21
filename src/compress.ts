import { Stats } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { optimize as svgo } from "svgo";
import { minify as htmlminifier } from 'html-minifier-terser';
import { minify as csso } from "csso";
import { formatBytes } from './utils';
import { table, TableUserConfig } from 'table';

type Result = {
  file: string;
  originalSize: number;
  compressedSize: number;
}

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

var state: State;

const beginProgress = (): void => {
  state = {
    total: {
      nbFiles: 0,
      nbFilesCompressed: 0,
      dataLenUncompressed: 0,
      dataLenCompressed: 0
    },
    detailsByExtension: {},
  }
}

const printProgress = (r: Result): void => {
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

  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`${state.total.nbFiles} files | ${formatBytes(state.total.dataLenUncompressed)} → ${formatBytes(state.total.dataLenCompressed)}`);
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

  var writeData = undefined;

  try {
    if (file.endsWith('.svg')) {
      const data = await fs.readFile(file);
      const newData = svgo(data, {});
      if (newData.error || newData.modernError) {
        // nok
        console.log( `Error svg ${file} ${newData}`)
      }
      else {
        writeData = (newData as any).data;
      }
    }  
    else if (file.endsWith('.html') || file.endsWith('.htm')) {
      const data = await fs.readFile(file);
      const newData = await htmlminifier(data.toString(), { minifyCSS: true, minifyJS: true, sortClassName: true, sortAttributes: true});
      writeData = newData;
    }
    else if (file.endsWith('.css')) {
      const data = await fs.readFile(file);
      const newData = await csso(data.toString()).css;
      if (newData) {
        writeData = newData;
      }
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

const processDirectory = async (directoryPath: string): Promise<Result[]> => {
    const filesInDirectory = await fs.readdir(directoryPath);
    const files = await Promise.all(
        filesInDirectory.map(async (file: string) => {
            const filePath = path.join(directoryPath, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isDirectory()) {
                return processDirectory(filePath);
            } else {
                return [await processFile(filePath, stats)];
            }
        })
    );
    return files.filter((file) => file.length).flat(1); // Remove empty dir and flat it all
};

export async function compress(dir: string): Promise<void> {
  console.log(`Compressing...`);
  
  beginProgress();
  await processDirectory(dir);
  endProgress();

  printDetails();
}
