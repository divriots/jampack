---
title: 'Images max width'
jampack: '--onlyoptim'
---

Images referenced in `.html` files can be limited to a max width.

```js
export default {
  image: {
    srcset_max_width: 1300,  // Max width used in srcset
    max_width: 1300, // Max width of output image
  },
};
```

See [configuration](/configuration/) for default values.

