// @ts-ignore
import load from '@proload/core';
import deepmerge from 'deepmerge';

import default_options from './config-default.js';
import fast_options_override from './config-fast.js';
import { GlobalState } from './state.js';
import { loadConfigCSS } from './compressors/css.js';

export function fast(state: GlobalState) {
  const options = default_options;
  Object.assign(state.options, deepmerge(options, fast_options_override));
}

export async function loadConfig(state: GlobalState) {
  const options = default_options;
  const proload = await load('jampack', { mustExist: false });
  if (proload) {
    console.log('Merging default config with:');
    console.log(JSON.stringify(proload.value, null, 2));
    Object.assign(state.options, deepmerge(options, proload.value));
  }
  loadConfigCSS(state);
}
