# Changelog

## [2.0.0](https://github.com/anchildress1/system-notes/compare/v1.2.0...v2.0.0) (2026-02-08) 🧿

> _In which I ship search improvements, then immediately declare victory._

I focused this release on tightening up the search experience and getting a clean 2.0.0 out the door without dragging the entire repository history into one changelog entry.

<details>
<summary>Receipts, commit links, and other delightful paperwork</summary>

### Features

- Search improvements ([#24](https://github.com/anchildress1/system-notes/issues/24)) ([ccd27f2](https://github.com/anchildress1/system-notes/commit/ccd27f24845c6af997d0793019c9139d75f81c4c))

### Miscellaneous Chores

- release 2.0.0 ([baaf3b6](https://github.com/anchildress1/system-notes/commit/baaf3b6d9c61b183929b1c8f8009cb6c72021819))
- release main ([#26](https://github.com/anchildress1/system-notes/issues/26)) ([a04b0fb](https://github.com/anchildress1/system-notes/commit/a04b0fb39b590d00b99ce1e30ee3514eb504bcac))

</details>

## [1.2.0](https://github.com/anchildress1/system-notes/compare/v1.1.0...v1.2.0) (2026-02-08) 🪄

> _In which I build a search-and-chat machine, then spend quality time punching flaky tests in the face._

I used this release to aggressively expand the Algolia/search surface area (crawler, indices, UI, and prompts), harden security around file access, and stabilize CI/E2E so the repo stops tripping over its own shoelaces.

<details>
<summary>All the links and none of the poetry</summary>

### Features

- Configure blog crawler ([#21](https://github.com/anchildress1/system-notes/issues/21)) ([399ffcc](https://github.com/anchildress1/system-notes/commit/399ffcc58b1c0130338322d4f4492f471e3cb8e4))
- configure search metric reporting ([#19](https://github.com/anchildress1/system-notes/issues/19)) ([b84f45c](https://github.com/anchildress1/system-notes/commit/b84f45c7e93e7d70246777cbf24cc3d7efe48d50))
- implement Fact Index search with 3D flip card UI ([86b4698](https://github.com/anchildress1/system-notes/commit/86b469829b8b3c640ec574604a7c474a2786fc74))
- **algolia:** unify index to `system-notes` with deploy script ([9531aa7](https://github.com/anchildress1/system-notes/commit/9531aa73fc0f50a8616b998634c8724ddffd2f7c))
- **search:** redesign Fact Index UI with immersive 3D flip-and-expand interaction ([52cab68](https://github.com/anchildress1/system-notes/commit/52cab682275cd488485a529057b94097aaeeaf45))
- **search:** unify Algolia config and migrate data to tiered tags ([aac3434](https://github.com/anchildress1/system-notes/commit/aac3434151312cc830200e10f37a3741d6019de6))
- **ui:** update AIChat to Ruckus 2.0 branding ([2155ba3](https://github.com/anchildress1/system-notes/commit/2155ba317c3d8a4fa893c835155861baa0005a4b))
- **web:** finalize Ruckus chat UI with premium glassmorphic styling and custom components ([da3d007](https://github.com/anchildress1/system-notes/commit/da3d007289b646329da191a65b43cdbd143a4ad5))

### Bug Fixes

- configure search metrics ([#20](https://github.com/anchildress1/system-notes/issues/20)) ([78a29f1](https://github.com/anchildress1/system-notes/commit/78a29f1d4c4a9d584ef60d4b2cb3fd9870a423b3))
- mobile music blog btn and performance ([#6](https://github.com/anchildress1/system-notes/issues/6)) ([1d5e096](https://github.com/anchildress1/system-notes/commit/1d5e09636054885bd493dedf26a0f63742388bde))
- **css:** enable pointer-events for AIChat container and input ([0dc29e1](https://github.com/anchildress1/system-notes/commit/0dc29e12e4a6ce8a162335efb6ca961321d7b834))
- **web:** add accessible label to chat toggle button ([8c18a48](https://github.com/anchildress1/system-notes/commit/8c18a4808881a090d30718c52ba8258a24378b3d))
- **web:** resolve chat 422 error by simplifying component structure ([45a850f](https://github.com/anchildress1/system-notes/commit/45a850f15ac8a61d9cb77cff4c8b96bc9d8055cd))
- **web:** fix reversed text on flip cards in expanded view ([f92dee2](https://github.com/anchildress1/system-notes/commit/f92dee254cbc4843e507ca2362814d59a84dd5d1))
- **web:** resolve post-rebase regressions and lint errors ([ab233c8](https://github.com/anchildress1/system-notes/commit/ab233c80774406edb7f5d2f29f67e658bd94085d))
- **api:** resolve path traversal vulnerability ([d29d37f](https://github.com/anchildress1/system-notes/commit/d29d37fe0722c0f3e10f6badb21d8ca419761cf4))
- **api:** implement library-based path sanitization (Werkzeug) ([4722532](https://github.com/anchildress1/system-notes/commit/47225327a36c0875e98b17929e9ee457cd9339e0))
- **api:** enforce strict path validation security rules ([1511030](https://github.com/anchildress1/system-notes/commit/15110308750d8ece1b1942426f9d20770ae111f2))
- **security:** enhance path validation and fix web linting ([3eca935](https://github.com/anchildress1/system-notes/commit/3eca93575b7d412e91693ae050636f5f991d431a))
- **security:** resolve CodeQL path traversal and info leak ([28ba5c1](https://github.com/anchildress1/system-notes/commit/28ba5c1a2ffff1380251f2408b9b60bdc109606a))
- **tests:** remove flaky AI readiness test and fix robots.txt casing ([4892551](https://github.com/anchildress1/system-notes/commit/4892551fa41f5f42ce6bafad8b54e2508f3284f6))

### Performance Improvements

- optimize expanded view animation and verify bundle ([435c481](https://github.com/anchildress1/system-notes/commit/435c481550d7b6a6104cd3f19f875276fba3e1a7))

### Miscellaneous Chores

- Fix chat location ([#23](https://github.com/anchildress1/system-notes/issues/23)) ([0c943ac](https://github.com/anchildress1/system-notes/commit/0c943ac))
- Set next release version to v2.0.0 in release-please manifest ([#18](https://github.com/anchildress1/system-notes/issues/18)) ([134b8a0](https://github.com/anchildress1/system-notes/commit/134b8a0))

</details>

## [1.1.0](https://github.com/anchildress1/system-notes/compare/v1.0.0...v1.1.0) (2026-01-23) 🗃️

> _In which I write down what the system is, so future-me can’t claim ignorance._

I used this release to formalize the architecture/docs and get the release automation into a less embarrassing shape.

<details>
<summary>Change list, for the chronically curious</summary>

### Features

- **docs:** overhaul README and add architecture docs ([#3](https://github.com/anchildress1/system-notes/issues/3)) ([a376713](https://github.com/anchildress1/system-notes/commit/a37671396065cfb475ed4ab03c0ea17b3bfa89af))

### Miscellaneous Chores

- add workflow_dispatch to release-please ([fdb0eed](https://github.com/anchildress1/system-notes/commit/fdb0eed))
- release 1.1.0 ([#4](https://github.com/anchildress1/system-notes/issues/4)) ([6318faa](https://github.com/anchildress1/system-notes/commit/6318faa))

</details>

## [1.0.0](https://github.com/anchildress1/system-notes/releases/tag/v1.0.0) (2026-01-23) 🏗️

> _In which I ship 1.0.0 and immediately start acting like the repo has always been stable._

I cut the first release after wiring up the initial UI, deployment basics, and a pile of “this should probably exist before I call it done” work like SEO/AI files and tests.

<details>
<summary>Launch notes, commit candy, and assorted trivia</summary>

### Features

- add music player, update about page, and make hero text interactive ([8083e0f](https://github.com/anchildress1/system-notes/commit/8083e0f))
- multi-region deployment, interactive heroes, and music player polish ([f3edb82](https://github.com/anchildress1/system-notes/commit/f3edb82))
- enhance sparkle effects and add comprehensive test coverage ([b3a57fa](https://github.com/anchildress1/system-notes/commit/b3a57fa))

### Bug Fixes

- SEO, AI, and more testing ([#1](https://github.com/anchildress1/system-notes/issues/1)) ([8dd0c6e](https://github.com/anchildress1/system-notes/commit/8dd0c6e))
- use explicit CORS origins with credentials ([0529a4b](https://github.com/anchildress1/system-notes/commit/0529a4b))
- finalize CORS fix and restore backend tests ([07e341c](https://github.com/anchildress1/system-notes/commit/07e341c))

### Miscellaneous Chores

- release 1.0.0 ([533e9de](https://github.com/anchildress1/system-notes/commit/533e9de))

</details>
