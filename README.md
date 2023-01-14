<div>

```
     __                                    __    
    |__|____    _____ ___________    ____ |  | __
    |  \__  \  /     \\____ \__  \ _/ ___\|  |/ /
    |  |/ __ \|  Y Y  \  |_> > __ \\  \___|    < 
/\__|  (____  /__|_|  /   __(____  /\___  >__|_ \
\______|    \/      \/|  |       \/     \/     \/
                      |__|
```

</div>

[![npm version](https://img.shields.io/npm/v/@divriots/jampack)](https://npmjs.org/package/@divriots/jampack) 
[![Discord](https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord)](https://discord.gg/XkQxSU9)

# Jampack

Optimizes static websites for best user experience and best Core Web Vitals scores.

<div id="banner">
  <div>Brought to you by</div>
  <a href="https://divRIOTS.com#gh-light-mode-only">
    <img width="150" height="40" src="https://divRIOTS.com/divriots.svg" alt="‹div›RIOTS" />
  </a>
  <a href="https://divRIOTS.com#gh-dark-mode-only">
    <img width="150" height="40" src="https://divRIOTS.com/divriots-dark.svg" alt="‹div›RIOTS" />
  </a>
</div>

## What is `jampack`?

> Not a bundler. Not a framework.

`jampack` is a post-processing tool that takes the output of your [Static Site Generator (aka SSG)](https://jamstack.org/generators/) and optimizes it for best user experience and best [Core Web Vitals](https://web.dev/learn-core-web-vitals/) scores.

## Why `jampack`?

- **Better user experience** for your website visitors. Specially on low-end devices.
- **Better SEO**. Page experience now [affects ranking](https://developers.google.com/search/docs/appearance/page-experience).
- **Easier maintenance**. Generating top performance webpages requires extra engineering in the composition of the pages that is counterproductive with the maintenance of the website.
- **Time saving**. Spend less time optimizing and let `jampack` perform the heaving-lifting for you.

## Quick use

```sh
# Optimize static website in `dist` folder
npx @divriots/jampack ./dist
```

For more options see [CLI options](https://jampack.divriots.com/cli-options).

## Documentation

Check the [Documentation side](https://jampack.divriots.com).

## `jampack` use in the wild

- [divRIOTS.com](https://divRIOTS.com)
- [Backlight.dev](https://backlight.dev)
- [story.to.design](https://story.to.design)
- [html.to.design](https://html.to.design/docs)
- [WebComponents.dev](https://WebComponents.dev)
- [LWC.studio](https://lwc.studio)
- [Components.studio](https://components.studio)
> Add yours here

## Why is it called `jampack`?

- ` jam`: From [Jamstack](https://en.wikipedia.org/wiki/Jamstack).
- `pack`: Reminescent of the [Executable Packers](https://en.wikipedia.org/wiki/Executable_compression#List_of_executable_packers) from the 90s.

## License

This software is released under the terms of the [MIT license](https://github.com/divriots/jampack/blob/main/LICENSE).


## Optimizations

### PASS 1 - Optimizations

This pass takes all `*.{html|.htm}` files and parse them for optimisation. 

| Optimization   | Technical details     | Related links | Available |
| -------------- | --------------------- |:------------:|:---------:|
| Generate responsive images and set `srcset` | Multiple smaller images are generated exclusively in `WebP` and `srcset` attribute is set accordingly.  | [web.dev](https://web.dev/patterns/web-vitals-patterns/images/responsive-images/) |  ✅  |
| Embed small images | If optimised image size is <500 bytes, image is embed in `[src]` |  |  ✅  |
| Set `width` and `height` if missing | Uses image size and aspect ratio to fill values | [web.dev](https://web.dev/optimize-cls/#images-without-dimensions) |  ✅  |
| Fix `width` or `height` if not numerical | Uses image size and aspect ratio to fill values | [web.dev](https://web.dev/optimize-cls/#images-without-dimensions) |  ✅  |
| Set lazy loading by default  | Sets `loading="lazy"` if `[loading]` is not set. | [web.dev](https://web.dev/lazy-loading-images/) |  ✅  |
| Set async decoding by default  | Sets `decoding="async"`. |  |  ✅  |
| Warn on missing `[alt]` | Warn on missing `alt` attribute but adds `alt=""` in case image is considered decorative. |  |  ✅  |
| 🔽 `<picture>`  |                       |      |   |
| - TODO         |                       |  |  ❌  |
