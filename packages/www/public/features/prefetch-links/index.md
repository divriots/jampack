---
title: Prefetch links
jampack: "--onlyoptim"
---

`jampack` can prefetch links on the page for faster future navigation.

Read more about [why you need link prefetch on web.dev](https://web.dev/link-prefetch).

## Configuration

```js
{
  misc: {
    prefetch_links: 'in-viewport',
  },
}
```

## Possible options

### `prefetch_links: 'off'`

No prefetch of links are added to the pages.

### `prefetch_links: 'in-viewport'`

`jampack` adds [quicklink](https://github.com/GoogleChromeLabs/quicklink) to all the html page.

[quicklink](https://github.com/GoogleChromeLabs/quicklink) prefetches links that appear in viewport during idle time.

> [quicklink](https://github.com/GoogleChromeLabs/quicklink) is a ~2K (minified/gzipped) Javascript module. This Javascript is asynchronously loaded by `jampack` at low priority and doesn't affect the performance of the pages. The quicklink module is loaded once by the browser and cached for new pages.

See [quicklink website](https://getquick.link/) for more information.
