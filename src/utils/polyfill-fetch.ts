import { fetch } from 'undici';

if (!Object.keys(global).includes('fetch')) {
  Object.defineProperty(global, 'fetch', { value: fetch });
}
