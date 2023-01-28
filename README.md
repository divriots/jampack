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

[Read the introduction blog post](https://divriots.com/blog/introducing-jampack)

## What can `jampack` do?

- [Optimize images](https://jampack.divriots.com/features/optimize-images)
- [Optimize assets above-the-fold](https://jampack.divriots.com/features/optimize-above-the-fold)
- [Embed small images](https://jampack.divriots.com/features/embed-small-images)
- [Compress all assets](https://jampack.divriots.com/features/compress-all)
- [Fix things automatically](https://jampack.divriots.com/features/autofixes)
- [Raise warnings](https://jampack.divriots.com/features/warnings)

## Quick use

```sh
# Optimize static website in `dist` folder
npx @divriots/jampack ./dist
```

For more options see [CLI options](https://jampack.divriots.com/cli-options).

## `jampack` used in the wild

- [divRIOTS.com](https://divRIOTS.com)
- [Backlight.dev](https://backlight.dev)
- [story.to.design](https://story.to.design)
- [html.to.design](https://html.to.design/docs)
- [WebComponents.dev](https://WebComponents.dev)
- [LWC.studio](https://lwc.studio)
- [Components.studio](https://components.studio)
- [keycloak.ch](https://keycloak.ch)
- [bayjs.org](https://bayjs.org/)
- [qwind.pages.dev](https://qwind.pages.dev/)
- [Bloycey's Blog](https://bloycey.blog/)
  
> Add yours here

## Why is it called `jampack`?

- `jam`: From [Jamstack](https://en.wikipedia.org/wiki/Jamstack).
- `pack`: Reminescent of the [Executable Packers](https://en.wikipedia.org/wiki/Executable_compression#List_of_executable_packers) from the 90s.

## License

This software is released under the terms of the [MIT license](https://github.com/divriots/jampack/blob/main/LICENSE).
