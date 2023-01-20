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

### Github Actions example

This is fairly easy to do with Github Actions, using the [actions/cache@v3](https://github.com/actions/cache) action:

```yml
    - uses: actions/cache@v3
      with:
        path: '.jampack'
        key: 'jampack'
    - name: Build
      shell: bash
      run: npm run build
```

This will effectively:
- save the `.jampack` folder to a cache named 'jampack' (you may want to have different keys if running `jampack` on different sites) after the job runs
- restore that `.jampack` folder before the `Build` step, allowing `jampack` to reuse the cache

## Versioning

`jampack` versions the cache.

Consequently, when you upgrade to a new version of `jampack`, it will build a full new cache.

## Options

See [CLI Options](./cli-options) for options around cache management.