---
title: Installation
description: `jampack` installation process
layout: ../layouts/MainLayout.astro
---

Let us start by installing `jampack` as a development dependency:

```sh
npm install -D @divriots/jampack
```

You can then either run `jampack` on its own, using `npm exec jampack [dir]` or add it to your build script.

A simple build script like this one:

``` json
  "scripts": {
    "build": "vite build",
  },
```

could then become

``` json
  "scripts": {
    "build": "vite build && jampack ./dist",
  },
```

...so `jampack` runs on all your builds!