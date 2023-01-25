---
title: 'Optimize images to WebP'
jampack: '--onlyoptim'
---

`jampack` transforms `JPEG` and `PNG` images to `WebP` using [`sharp`](https://sharp.pixelplumbing.com).

- `JPEG` images are compressed into lossly `WebP`.
- `PNG` images are compressed into near lossless `WebP` using the [near_lossless option of the sharp library](https://sharp.pixelplumbing.com/api-output#webp).

If the new `WebP` image is larger than the original image, then the original image is used.