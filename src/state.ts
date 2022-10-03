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

export type GlobalState = {
  dir: string;
  args: Args;
  compressedFiles: string[];
  compressedFilesResult: Result[];
  summary: Summary,
  summaryByExtension: Record<string, Summary>
}


const state: GlobalState = { 
  dir: 'dist', 
  args: {}, 
  compressedFiles: [],
  compressedFilesResult: [],
  summary: {
    nbFiles: 0,
    nbFilesCompressed: 0,
    dataLenCompressed: 0,
    dataLenUncompressed: 0
  },
  summaryByExtension: {}
};

export default state;
