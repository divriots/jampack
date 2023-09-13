---
title: Inline critical CSS
jampack: "--onlyoptim"
---

> THIS IS EXPERIMENTAL AND ONLY WORKS FOR RELATIVE CSS STYLESHEETS RIGHT NOW. NOT ENABLED BY DEFAULT.

`jampack` uses [`critters`](https://github.com/GoogleChromeLabs/critters) to inline critical CSS and lazy-loads the rest.

- Avoids a [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) while the stylesheet is remotely downloaded after the html content.
- Improves [CLS](https://web.dev/cls/) score of [Core Web Vitals](https://web.dev/vitals/).

## Configuration

```js
{
  css: {
    inline_critical_css: true,
  }
}
```

## Example

When a stylesheet is loaded on another file like here:

```html
<html>
  <head>
    <title>Testing</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="container">
      <header>
        <div class="banner">Lorem ipsum dolor sit amet</div>
      </header>
    </div>
    <div>
      <h1>Hello World!</h1>
      <p>This is a paragraph</p>
      <input class="input-field" />
      <div class="contents"></div>
      <div class="selected active"></div>
    </div>
    <footer></footer>
  </body>
</html>

```

Resulting into this `HTML` where only the relevant critical `CSS` rules for the first paint are inlined into the `<head>`:

```html
<html data-critters-container>
  <head>
    <title>Testing</title>
    <style>
h1 {
  color: blue;
}

p {
  color: purple;
}

header {
  padding: 0 50px;
}

.banner {
  font-family: sans-serif;
}

.contents {
  padding: 50px;
  text-align: center;
}

.input-field {
  padding: 10px;
}

footer {
  margin-top: 10px;
}

.container {
  border: 1px solid;
}

div:is(:hover, .active) {
  color: #000;
}

div:is(.selected, :hover) {
  color: #fff;
}
</style>
  <link rel="preload" href="styles.css" as="style">
  </head>
  <body>
    <div class="container">
      <header>
        <div class="banner">Lorem ipsum dolor sit amet</div>
      </header>
    </div>
    <div>
      <h1>Hello World!</h1>
      <p>This is a paragraph</p>
      <input class="input-field">
      <div class="contents"></div>
      <div class="selected active"></div>
    </div>
    <footer></footer>

<link rel="stylesheet" href="styles.css"></body></html>
```

The rest of the stylesheet is lazy-loaded at the end of the file:

```html
<link rel="stylesheet" href="styles.css">
```

but preloaded in header for maximum performance:

```html
<link rel="preload" href="styles.css" as="style">
```
