---
title: 'Optimize images to WebP'
jampack: '--onlyoptim'
---

`jampack` transforms `jpeg` and `png` images to `WebP` using [`sharp`](https://sharp.pixelplumbing.com).

- `jpeg` images are compressed into lossly `WebP`.
- `png` images are compressed into near lossless `WebP` using the [near_lossless option of the sharp library](https://sharp.pixelplumbing.com/api-output#webp).

If the new `WebP` image is larger than the original image, then the original image is used.