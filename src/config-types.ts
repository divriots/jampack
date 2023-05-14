export type WebpOptions = {
  effort: number;
  mode: 'lossless' | 'lossly';
  quality: number;
};

export type Options = {
  html: {
    /*
      jampack adds a little bit of css to make
      image keep correct aspect ratio after adding
      image dimensions.
      ":where(img){height:auto;width:auto}"
    */
    add_css_reset_as: 'inline' | 'off';
  };
  image: {
    embed_size: number;
    srcset_min_width: number;
    compress: boolean;
    jpeg: {
      options: {
        quality: number;
        mozjpeg: boolean;
      };
    };
    png: {
      options: {
        compressionLevel: number;
      };
    };
    webp: {
      options_lossless: WebpOptions;
      options_lossly: WebpOptions;
    };
  };
};
