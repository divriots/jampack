import path from "path";

export type Args = {
  nowrite?: boolean;
}

export type ReportItem = {
  action: string;
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
  optimizedFiles: Set<string> = new Set();
  summary: Summary = {
    nbFiles: 0,
    nbFilesCompressed: 0,
    dataLenCompressed: 0,
    dataLenUncompressed: 0
  };
  summaryByExtension: Record<string, Summary> = {};

  reportItem(r: ReportItem) {
    const isCompressed = r.compressedSize < r.originalSize ? 1 : 0;

    this.summary.nbFiles++;
    state.summary.nbFilesCompressed += isCompressed;
    state.summary.dataLenUncompressed += r.originalSize;
    state.summary.dataLenCompressed += r.compressedSize;
    
    if(r.action) {
      let summary = this.summaryByExtension[r.action];
      if (!summary) {
        summary = {
          nbFiles: 0,
          nbFilesCompressed: 0,
          dataLenUncompressed: 0,
          dataLenCompressed: 0
        }
        this.summaryByExtension[r.action] = summary;
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
