import { defaultTargets } from './compressors/css.js';
import default_options from './config-default.js';

export type Args = {
  nowrite?: boolean;
  nocache?: boolean;
  cache_folder?: string;
  sequential_compress?: boolean;
};

export type ReportItem = {
  action: string;
  originalSize: number;
  compressedSize: number;
};

type Summary = {
  nbFiles: number;
  nbFilesCompressed: number;
  dataLenUncompressed: number;
  dataLenCompressed: number;
};

type Issue = {
  type: 'invalid' | 'a11y' | 'perf' | 'erro' | 'fix' | 'warn';
  msg: string;
};

export class GlobalState {
  dir: string = 'dist';
  args: Args = {};
  options = default_options;
  targets = defaultTargets();

  compressedFiles: Set<string> = new Set();

  issues: Map<string, Issue[]> = new Map();

  summary: Summary = {
    nbFiles: 0,
    nbFilesCompressed: 0,
    dataLenCompressed: 0,
    dataLenUncompressed: 0,
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
    this.summary.nbFilesCompressed += isCompressed;
    this.summary.dataLenUncompressed += r.originalSize;
    this.summary.dataLenCompressed += r.compressedSize;

    if (r.action) {
      let summary = this.summaryByExtension[r.action];
      if (!summary) {
        summary = {
          nbFiles: 0,
          nbFilesCompressed: 0,
          dataLenUncompressed: 0,
          dataLenCompressed: 0,
        };
        this.summaryByExtension[r.action] = summary;
      }
      summary.nbFiles++;
      summary.nbFilesCompressed += isCompressed;
      summary.dataLenUncompressed += r.originalSize;
      summary.dataLenCompressed += r.compressedSize;
    }
  }
}
