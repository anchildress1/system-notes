# Font licenses

The `.woff2` files in this directory are the `latin` subsets published by Google Fonts. They are
vendored here so the build does not depend on reaching `fonts.googleapis.com` — a fetch that has
already failed a CI run and taken the whole build with it.

All four families are licensed under the **SIL Open Font License 1.1**, which permits bundling
and redistribution provided the copyright notice travels with the files.

| Font                       | Copyright                                                          | Upstream                                                       |
| -------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| Space Grotesk              | Copyright 2020 The Space Grotesk Project Authors                   | https://github.com/floriankarsten/space-grotesk                |
| Instrument Serif           | Copyright 2022 The Instrument Serif Project Authors                | https://github.com/Instrument/instrument-serif                 |
| Atkinson Hyperlegible Next | Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors | https://github.com/googlefonts/atkinson-hyperlegible-next      |
| Atkinson Hyperlegible Mono | Copyright 2020-2024 The Atkinson Hyperlegible Mono Project Authors | https://github.com/googlefonts/atkinson-hyperlegible-next-mono |

The full license text lives at [`public/fonts/OFL.txt`](../../../public/fonts/OFL.txt), carrying all
four copyright notices. It sits in `public/` deliberately rather than beside these `.woff2` files:
the fonts are redistributed to every visitor out of `/_next/static`, and OFL §2 requires the licence
to travel with them, so the copy has to be served too — it is reachable at `/fonts/OFL.txt`.

## Refreshing these files

They are `latin`-subset only, matching what `next/font/google` was requesting before. To pull a
newer cut, take the `/* latin */` block from the Google Fonts CSS for each family and download the
`woff2` it points at:

```
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700
https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1
https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@200..800
https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Mono:wght@200..800
```

Request them with a modern browser `User-Agent`; Google serves `ttf` to unrecognised clients.
