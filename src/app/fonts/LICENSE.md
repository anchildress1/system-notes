# Font licenses

The `.woff2` files in this directory are vendored `latin` subsets from Google Fonts. Archivo and
Space Grotesk load through `next/font/local`; a clean build does not fetch either family.

Every family here is licensed under the **SIL Open Font License 1.1**, which permits bundling
and redistribution provided the copyright notice travels with the files.

| Font          | Role                       | Delivery                                     | Copyright                                        | Upstream                                        |
| ------------- | -------------------------- | -------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Archivo       | Body and UI                | Vendored `woff2`                             | Copyright 2020 The Archivo Project Authors       | https://github.com/Omnibus-Type/Archivo         |
| Space Grotesk | Wordmark and metadata      | Vendored `woff2`                             | Copyright 2020 The Space Grotesk Project Authors | https://github.com/floriankarsten/space-grotesk |
| Bodoni Moda   | Editorial display headings | Resolved by `next/font/google` at build time | Copyright 2020 The Bodoni Moda Project Authors   | https://github.com/indestructible-type/Bodoni   |

Instrument Serif and JetBrains Mono were removed with the Intake redesign. Bodoni Moda is emitted
into Next's static font output during the build; it is not a checked-in `woff2` in this directory.

The full license text lives at [`public/fonts/OFL.txt`](../../../public/fonts/OFL.txt). It sits in
`public/` deliberately rather than beside these `.woff2` files:
the fonts are redistributed to every visitor out of `/_next/static`, and OFL §2 requires the license
to travel with them, so the copy has to be served too — it is reachable at `/fonts/OFL.txt`.

## Refreshing these files

The vendored files are `latin`-subset only. That subset does not carry `№`, `★`, or `↗`, so those
glyphs fall back to a system face.

To pull a newer cut, take the `/* latin */` block from the Google Fonts CSS for each family and
download the `woff2` it points at:

```
https://fonts.googleapis.com/css2?family=Archivo:wght@100..900
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700
```

Request them with a modern browser `User-Agent`; Google serves `ttf` to unrecognised clients.

Space Grotesk has a `wght` axis and no italic. Bodoni Moda's weights and italic cut are declared
in `src/app/layout.tsx`; change that declaration when changing the display family.
