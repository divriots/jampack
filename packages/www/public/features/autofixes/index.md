---
title: Auto-fixes
jampack: "--onlyoptim"
---

`jampack` will fix issues in assets automatically.

## Wrong format for `width` and `height` in `<img>`s

Should be numerical values only.

`jampack` will fix either or both values based on the dimensions of the image.

## Reordering `<source>` nodes in `<picture>`

For `<picture>` images that already have sources, the `<node>` children will be reorder to make sure `AVIF` sources are first and followed by `WebP` sources since these are the most efficient format but with less browser support.

```html
<picture>
    <source type="image/webp" srcset="./redpanda@1936w.webp 1936w, ./redpanda@1636w.webp 1636w, ./redpanda@1336w.webp 1336w, ./redpanda@1036w.webp 1036w, ./redpanda@736w.webp 736w">
    <source type="image/avif" srcset="./redpanda@1936w.avif 1936w, ./redpanda@1636w.avif 1636w, ./redpanda@1336w.avif 1336w, ./redpanda@1036w.avif 1036w, ./redpanda@736w.avif 736w">
    <img src="./redpanda.jpg" alt loading="lazy" decoding="async" width="1936" height="1296" srcset="./redpanda.jpg 1936w, ./redpanda@1636w.jpg 1636w, ./redpanda@1336w.jpg 1336w, ./redpanda@1036w.jpg 1036w, ./redpanda@736w.jpg 736w" sizes="100vw">
</picture>
```

will become

```html
<picture>
    <source type="image/avif" srcset="./redpanda@1936w.avif 1936w, ./redpanda@1636w.avif 1636w, ./redpanda@1336w.avif 1336w, ./redpanda@1036w.avif 1036w, ./redpanda@736w.avif 736w">
    <source type="image/webp" srcset="./redpanda@1936w.webp 1936w, ./redpanda@1636w.webp 1636w, ./redpanda@1336w.webp 1336w, ./redpanda@1036w.webp 1036w, ./redpanda@736w.webp 736w">
    <img src="./redpanda.jpg" alt loading="lazy" decoding="async" width="1936" height="1296" srcset="./redpanda.jpg 1936w, ./redpanda@1636w.jpg 1636w, ./redpanda@1336w.jpg 1336w, ./redpanda@1036w.jpg 1036w, ./redpanda@736w.jpg 736w" sizes="100vw">
</picture>
```
