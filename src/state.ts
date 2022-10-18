import path from "path";

export type Args = {
  nowrite?: boolean;
}

export type ReportItem = {
  action: string;
  originalSize: number;
  compressedSize: number;
}

type Summary = {
  nbFiles: number;
  nbFilesCompressed: number;
  dataLenUncompressed: number;
  dataLenCompressed: number;
}

type Issue = {
  type: 'invalid' | 'a11y' | 'perf' | 'erro' | 'warn';
  msg: string;
}

export class GlobalState {
  dir: string = 'dist';
  args: Args = {};

  compressedFiles: Set<string> = new Set();
  optimizedFiles: Set<string> = new Set();

  issues: Map<string, Issue[]> = new Map();

  summary: Summary = {
    nbFiles: 0,
    nbFilesCompressed: 0,
    dataLenCompressed: 0,
    dataLenUncompressed: 0
  };
  summaryByExtension: Record<string, Summary> = {};

  reportIssue(sourceFile: string, issue: Issue) {
    let issueList = this.issues.get(sourceFile);
    if (issueList === undefined) {
      issueList = [];
      this.issues.set(sourceFile, issueList);
    }
    issueList.push(issue);
  }

  reportSummary(r: ReportItem) {
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
