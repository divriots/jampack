---
title: 'Optimize images'
jampack: '--onlyoptim'
---

`jampack` optimizes images for faster download on any device and better [Core Web Vitals](https://web.dev/learn-core-web-vitals/) scores.

- Compresses images using better compressors or modern formats.
- Generates responsive image sets for smaller devices.
- Adds image dimensions if missing to [avoid CLS issues](https://web.dev/optimize-cls/#images-without-dimensions).
- Sets images to lazy loading (with [exceptions](#exceptions))

## `<img>` tags

```html
<img src="./redpanda.jpg" alt="Red panda">
```

becomes

```html
<img src="./redpanda.jpg.webp" alt="Red panda" 
     srcset="./redpanda.jpg.webp 3872w, ./redpanda@3572w.jpg.webp 3572w, ./redpanda@3272w.jpg.webp 3272w, ./redpanda@2972w.jpg.webp 2972w, ./redpanda@2672w.jpg.webp 2672w, ./redpanda@2372w.jpg.webp 2372w, ./redpanda@2072w.jpg.webp 2072w, ./redpanda@1772w.jpg.webp 1772w, ./redpanda@1472w.jpg.webp 1472w, ./redpanda@1172w.jpg.webp 1172w, ./redpanda@872w.jpg.webp 872w"
     sizes="100vw"
     loading="lazy"
     decoding="async"
     width="3872" 
     height="2592">
```

### `src` image is compressed

- `JPEG` images are compressed into lossly `WebP` using [`sharp`](https://sharp.pixelplumbing.com).
- `PNG` images are compressed into near lossless `WebP` using the [near_lossless option of the sharp library](https://sharp.pixelplumbing.com/api-output#webp).
- `AVIF` images are compressed using [`sharp`](https://sharp.pixelplumbing.com).
- `SVG` images are compressed using [svgo](https://github.com/svg/svgo)

### `srcset` of smaller images are generated

`jampack` will generate a set of smaller images by reducing the width of the images by steps of 300px.

- Images above the fold generate [progressives `JPEG`](https://www.thewebmaster.com/progressive-jpegs/) as described in the [above the fold optimization](../optimize-above-the-fold/).
- `PNG` and `JPEG` images will generate `WebP` responsive images.
- `AVIF` images will generate `AVIF` responsive images.

In other words, you can have a single image in your static site and `jampack` will create the different smaller versions to serve the most optimized image for smaller devices.

If `srcset` is already present in source `<img>` then nothing is done and images are just compressed in
[PASS 2](../compress-all/).

#### Responsives sizes

You can set `sizes` attribute to fine tune image selection in the `srcset`.
See [`sizes` attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-sizes) for more details. 

`sizes="100vw"` will be added by default when `srcset` is set.


### Lazy loading

`jampack` will set all images to load in lazy by default. This gives the browser the opportunity to load more critical data instead.

Images will have new attributes:
- `loading="lazy"`
- `decoding="async"`

#### Exceptions

Images will not be lazy loaded in the following conditions:

- Image has attribute `loading="eager"`. Explicitly requesting for no lazy loading.
- Image is marked [above the fold](../optimize-above-the-fold/).

#### Note

[Lazy loading images above the fold can cause LCP issues](https://web.dev/lazy-loading-images/#effects-on-largest-contentful-paint-lcp),
we recommend to use the `jampack`'s [`<the-fold>` feature](../optimize-above-the-fold/) or mark images with `loading="eager"` for images above the fold.

### Sets `width` and `height` attributes

`jampack` will set [image dimensions to avoid CLS issues](https://web.dev/optimize-cls/#images-without-dimensions).

`jampack` will also fix images with invalid format for attributes `width` or `height`.

## `<picture>` tags

`jampack` will enrich `<picture>` tags with `AVIF` and `WebP` sources when they are missing.

```html
<picture>
    <img src="./redpanda.jpg" alt="Red panda">
</picture>
```

will become

```html
<picture>
    <source type="image/avif" srcset="./redpanda@1936w.avif 1936w, ./redpanda@1636w.avif 1636w, ./redpanda@1336w.avif 1336w, ./redpanda@1036w.avif 1036w, ./redpanda@736w.avif 736w">
    <source type="image/webp" srcset="./redpanda@1936w.webp 1936w, ./redpanda@1636w.webp 1636w, ./redpanda@1336w.webp 1336w, ./redpanda@1036w.webp 1036w, ./redpanda@736w.webp 736w">
    <img src="./redpanda.jpg" alt="Red panda" loading="lazy" decoding="async" width="1936" height="1296" srcset="./redpanda.jpg 1936w, ./redpanda@1636w.jpg 1636w, ./redpanda@1336w.jpg 1336w, ./redpanda@1036w.jpg 1036w, ./redpanda@736w.jpg 736w" sizes="100vw">
</picture>
```

If the original image is lossless (`PNG`) then:
- The `AVIF` image set will be compressed with very high quality settings.
- The `WebP` image set will be compressed with [near_lossless option](https://sharp.pixelplumbing.com/api-output#webp).

If the original image is lossly (`JPEG`) then:
- The `AVIF` image set will be compressed with normal quality settings.
- The `WebP` image set will be lossly compressed.
