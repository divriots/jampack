import { Stats } from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { formatBytes } from './utils.js';
import { GlobalState, ReportItem } from './state.js';
import { globby } from 'globby';
import ora from 'ora';
import { compressCSS } from './compressors/css.js';
import { compressJS } from './compressors/js.js';
import { compressHTML } from './compressors/html.js';
import { compressImage } from './compressors/images.js';

const processFile = async (
  state: GlobalState,
  file: string,
  stats: Stats
): Promise<void> => {
  let writeData: Buffer | string | undefined = undefined;
  const fs = state.vfs ?? fsp;

  try {
    const ext = path.extname(file);

    switch (ext) {
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.svg':
      case '.webp':
      case '.avif':
        if (state.options.image.compress) {
          const imgData = await fs.readFile(file);
          const newImage = await compressImage(state, imgData, {});
          if (newImage?.data && newImage.data.length < stats.size) {
            writeData = newImage.data;
          }
        }
        break;
      case '.html':
      case '.htm':
        const htmldata = await fs.readFile(file);
        const newhtmlData = await compressHTML(state, htmldata);
        writeData = newhtmlData;
        break;
      case '.css':
        const cssdata = await fs.readFile(file);
        const newCSS = await compressCSS(state, cssdata);
        if (newCSS && newCSS.length < cssdata.length) {
          writeData = newCSS;
        }
        break;
      case '.js':
        const jsdata = await fs.readFile(file);
        const newJS = await compressJS(state, jsdata.toString());
        if (newJS && newJS.length < jsdata.length) {
          writeData = newJS;
        }
        break;
    }
  } catch (e) {
    // console error for the moment
    console.error(`\n${file}`);
    console.error(e);
  }

  const result: ReportItem = {
    action: path.extname(file),
    originalSize: stats.size,
    compressedSize: stats.size,
  };

  // Writedata
  if (writeData && writeData.length < result.originalSize) {
    result.compressedSize = writeData.length;

    if (!state.args.nowrite) {
      await fs.writeFile(file, writeData);
    }
  }

  state.compressedFiles.add(file);
  state.reportSummary(result);
};

export async function compressFolder(
  state: GlobalState,
  exclude?: string
): Promise<void> {
  const fs = state.vfs ?? fsp;
  const spinner = ora(getProgressText(state)).start();

  const globs = ['**/**', '!_jampack/**']; // Exclude jampack folder because already compressed
  if (exclude) globs.push('!' + exclude);
  const paths = await globby(globs, { cwd: state.dir, absolute: true });

  async function compressFile(file: string) {
    if (!state.compressedFiles.has(file)) {
      await processFile(state, file, await fs.stat(file));
      spinner.text = getProgressText(state);
    }
  }

  if (!state.args.sequential_compress) {
    // "Parallel" processing
    await Promise.all(paths.map(compressFile));
  } else {
    for (const file of paths) await compressFile(file);
  }

  spinner.text = getProgressText(state);
  spinner.succeed();
}

const getProgressText = (state: GlobalState): string => {
  const gain =
    state.summary.dataLenUncompressed - state.summary.dataLenCompressed;
  return `${state.summary.nbFiles} files | ${formatBytes(
    state.summary.dataLenUncompressed
  )} → ${formatBytes(state.summary.dataLenCompressed)} | -${formatBytes(
    gain
  )} `;
};
