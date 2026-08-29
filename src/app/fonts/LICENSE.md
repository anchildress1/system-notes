# Font licenses

The `.woff2` files in this directory are the `latin` subsets published by Google Fonts. They are
vendored here so the build does not depend on reaching `fonts.googleapis.com` — a fetch that has
already failed a CI run and taken the whole build with it.

Every family here is licensed under the **SIL Open Font License 1.1**, which permits bundling
and redistribution provided the copyright notice travels with the files.

| Font          | Role                          | Copyright                                        | Upstream                                        |
| ------------- | ----------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Archivo       | Body and UI                   | Copyright 2020 The Archivo Project Authors       | https://github.com/Omnibus-Type/Archivo         |
| Space Grotesk | Wordmark, headlines, metadata | Copyright 2020 The Space Grotesk Project Authors | https://github.com/floriankarsten/space-grotesk |

Syne, Fragment Mono and Instrument Serif were removed with the Intake redesign. Space Grotesk
covers all three roles, which took the font payload from 115 KB to 57 KB.

The full license text lives at [`public/fonts/OFL.txt`](../../../public/fonts/OFL.txt), carrying all
copyright notices. It sits in `public/` deliberately rather than beside these `.woff2` files:
the fonts are redistributed to every visitor out of `/_next/static`, and OFL §2 requires the license
to travel with them, so the copy has to be served too — it is reachable at `/fonts/OFL.txt`.

## Refreshing these files

They are `latin`-subset only. That subset is what every family here has always shipped, and it is
worth knowing what it does not carry: `№`, `★` and `↗` are outside it and fall back to a system
face on every one of these fonts, exactly as they did before the swap.

To pull a newer cut, take the `/* latin */` block from the Google Fonts CSS for each family and
download the `woff2` it points at:

```
https://fonts.googleapis.com/css2?family=Archivo:wght@100..900
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700
```

Request them with a modern browser `User-Agent`; Google serves `ttf` to unrecognised clients.

Space Grotesk has a `wght` axis and nothing else — no italic, no slant. Anything that asks for
`font-style: italic` gets a synthesized oblique, so emphasis is carried by the accent color
instead.
