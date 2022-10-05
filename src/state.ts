import path from "path";

export type Args = {
  nowrite?: boolean;
}

export type Result = {
  file: string;
  originalSize: number;
  compressedSize: number;
}

export type Summary = {
  nbFiles: number;
  nbFilesCompressed: number;
  dataLenUncompressed: number;
  dataLenCompressed: number;
}

export class GlobalState {
  dir: string = 'dist';
  args: Args = {};
  compressedFiles: Set<string> = new Set();
  compressedFilesResult: Result[] = [];
  summary: Summary = {
    nbFiles: 0,
    nbFilesCompressed: 0,
    dataLenCompressed: 0,
    dataLenUncompressed: 0
  };
  summaryByExtension: Record<string, Summary> = {};

  addFile(r: Result) {
    const isCompressed = r.compressedSize < r.originalSize ? 1 : 0;

    this.compressedFiles.add(r.file);
    this.compressedFilesResult.push(r);

    this.summary.nbFiles++;
    state.summary.nbFilesCompressed += isCompressed;
    state.summary.dataLenUncompressed += r.originalSize;
    state.summary.dataLenCompressed += r.compressedSize;
    
    const ext = path.extname(r.file);
    if(ext) {
      let summary = this.summaryByExtension[ext];
      if (!summary) {
        summary = {
          nbFiles: 0,
          nbFilesCompressed: 0,
          dataLenUncompressed: 0,
          dataLenCompressed: 0
        }
        this.summaryByExtension[ext] = summary;
      }
      summary.nbFiles++;
      summary.nbFilesCompressed += isCompressed;
      summary.dataLenUncompressed += r.originalSize;
      summary.dataLenCompressed += r.compressedSize;
    }
  };
  
}

const state = new GlobalState();

export default state;
