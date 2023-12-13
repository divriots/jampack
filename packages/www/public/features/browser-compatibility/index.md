---
title: Browser compatibility
---

`jampack` can improve browser compatibility by adding fallbacks, vendor prefixes or lowering syntax of cutting edge CSS features.


## CSS transpilation

You can configure your level of compatibility by configuring the browser targets using the [browserslist query syntax](https://browserslist.dev/).

```js
{
  "general": {
    "browserslist": 'last 12 versions'
  }
}
```

See [browserslist](https://browserslist.dev/) for more details about the query syntax.
See [ligthningcss transpilation](https://lightningcss.dev/transpilation.html) for examples of transpilation.