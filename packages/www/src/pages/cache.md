---
title: Cache
description: Data processing is cached to avoid long and redundant processing.
layout: ../layouts/MainLayout.astro
---

`jampack` caches image processing to avoid lengthy and redundant image resizing and compression.
The cache dramatically reduces the processing time of `jampack`.

The cache is stored in the folder `.jampack/cache/`.

## CI Builds

We recommend that you save and restore folder `.jampack/cache/` in your CI workflow
to benefit from the cache between builds. This way, `jampack` will only process new images when present.

## Versioning

`jampack` versions the cache.

Consequently, when you upgrade to a new version of `jampack`, it will build a full new cache.

## Options

See [CLI Options](./cli-options) for options around cache management.