import * as url from 'url';
import * as path from 'path';

export function formatBytes(bytes:number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`
}

export function isLocal(src: string) {
  const u = url.parse(src);
  return !u.host;
}

export function translateSrc(projectRoot: string, htmlRelativePath: string, src: string) {
  if (!isLocal(src)) {
    throw new Error('Source should be local');
  }

  const srcAbsolutePath = path.join(projectRoot, src.startsWith('/') ? '' : htmlRelativePath, src);
  return path.resolve(srcAbsolutePath);
}

export function isNumeric(value: string) {
  return /^\d+$/.test(value);
}