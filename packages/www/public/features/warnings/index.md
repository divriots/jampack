---
title: 'Warnings'
jampack: '--onlyoptim'
---

`jampack` will raise warning when discovering non-blocking issues that require your attention and that you should fix.

## Accessibility

### `alt` attribute is missing an tag `<img>`

Spec > https://html.spec.whatwg.org/multipage/images.html#alt

`jampack` will add an empty attribute `alt=""` because it can be valid for [decorative images](https://www.w3.org/WAI/tutorials/images/decorative/).
But you should always fix the warning by adding a descriptive `alt` or an empty attribute for decorative images.
