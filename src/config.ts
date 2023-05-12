// @ts-ignore
import load from '@proload/core';
import deepmerge from 'deepmerge';

import default_options from './config-default.js';
import fast_options_override from './config-fast.js';

const options = default_options;

export function fast() {
  deepmerge(options, fast_options_override);
}

export async function loadConfig() {
  const proload = await load('jampack', { mustExist: false });
  if (proload) {
    console.log('Overriding default config with:');
    console.log(JSON.stringify(proload.value, null, 2));
    deepmerge(options, proload.value);
  }
}

export default options;
