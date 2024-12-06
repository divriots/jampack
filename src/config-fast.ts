//import { Options } from './config-types.js';

const fast_options_override: any = {
  image: {
    embed_size: 0,
    srcset_min_width: 99999,
    compress: false,
    jpeg: {
      options: {
        mozjpeg: false,
      },
    },
    png: {
      options: {
        compressionLevel: 0,
      },
    },
    webp: {
      options_lossless: {
        effort: 0,
      },
      options_lossly: {
        effort: 0,
      },
    },
    svg: {
      optimization: false,
    },
  },
  misc: {
    prefetch_links: 'none',
  },
};

export default fast_options_override;
