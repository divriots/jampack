---
title: 'Compress images to WebP'
---

`jampack` compresses `jpeg` and `png` images to `WebP`.

- `jpeg` images are compressed into lossly `WebP`.
- `png` images are compressed into near lossless `WebP` using the [`near_lossless` option of the sharp library](https://sharp.pixelplumbing.com/api-output#webp).

