# Changelog

## [1.0.0](https://github.com/anchildress1/system-notes/compare/system-notes-v1.2.0...system-notes-v1.0.0) (2026-02-09)


### Features

* **algolia-challenge:** add RAG failure modes and link capping ([9431d60](https://github.com/anchildress1/system-notes/commit/9431d60396299a547ec7722ded635753c2638ac8))
* **algolia-challenge:** refine agent behavior and add chat session persistence ([346cd6b](https://github.com/anchildress1/system-notes/commit/346cd6bceb0a72927978bcf7c4870cdb43b10a69))
* **algolia:** add knowledge graph indices with visual assets ([d011338](https://github.com/anchildress1/system-notes/commit/d0113383d03d83d99e4859167041f1a159c30123))
* **algolia:** add list framing rules for result truncation ([0372952](https://github.com/anchildress1/system-notes/commit/037295297e2d7caa73b7d2ed05763d09e3b9ef07))
* **algolia:** implement graph rag workflow and optimize agent prompt ([5226385](https://github.com/anchildress1/system-notes/commit/5226385636a8f614c0f37dc639c7464b9b8accf4))
* **algolia:** integrate search with Algolia indices and agent ([6bd1fa9](https://github.com/anchildress1/system-notes/commit/6bd1fa986cacb5cd628b9658584c608712f9f987))
* **algolia:** redesign about and projects indexes for RAG agent ([549e07d](https://github.com/anchildress1/system-notes/commit/549e07d9ed61051daa19fc5aa130ce1ff866bd26))
* **algolia:** redesign about and projects indexes with narrative schema ([359cdef](https://github.com/anchildress1/system-notes/commit/359cdef0e412d51d3fe2add43283a0a0b5cd0596))
* **algolia:** simplify indexing workflow and remove data enrichment ([8481e5d](https://github.com/anchildress1/system-notes/commit/8481e5df7c2bc1da694a02d4ee11e9eaee2fd6e3))
* **algolia:** unify index to 'system-notes' with deploy script ([9531aa7](https://github.com/anchildress1/system-notes/commit/9531aa73fc0f50a8616b998634c8724ddffd2f7c))
* Configure blog crawler ([#21](https://github.com/anchildress1/system-notes/issues/21)) ([399ffcc](https://github.com/anchildress1/system-notes/commit/399ffcc58b1c0130338322d4f4492f471e3cb8e4))
* configure search metric reporting ([#19](https://github.com/anchildress1/system-notes/issues/19)) ([b84f45c](https://github.com/anchildress1/system-notes/commit/b84f45c7e93e7d70246777cbf24cc3d7efe48d50))
* implement algolia rag chat and markdown support ([f6de9fb](https://github.com/anchildress1/system-notes/commit/f6de9fb759ddfa8e60bb951bed28ef81d716f3f5))
* implement deterministic links and failure modes ([b31be31](https://github.com/anchildress1/system-notes/commit/b31be3192a5c7a9d0ab611e8f197605e7b094b27))
* implement Fact Index search with 3D flip card UI ([86b4698](https://github.com/anchildress1/system-notes/commit/86b469829b8b3c640ec574604a7c474a2786fc74))
* **search:** redesign Fact Index UI with immersive 3D flip-and-expand interaction ([52cab68](https://github.com/anchildress1/system-notes/commit/52cab682275cd488485a529057b94097aaeeaf45))
* **search:** unify Algolia config and migrate data to tiered tags ([aac3434](https://github.com/anchildress1/system-notes/commit/aac3434151312cc830200e10f37a3741d6019de6))
* stabilize e2e tests and cleanup codebase ([ef73fe4](https://github.com/anchildress1/system-notes/commit/ef73fe4ee3c46970672653340461703dccb69dd9))
* **ui:** update AIChat to Ruckus 2.0 branding ([2155ba3](https://github.com/anchildress1/system-notes/commit/2155ba317c3d8a4fa893c835155861baa0005a4b))
* **web:** add proper sitemap.xml and AI discoverability files ([#14](https://github.com/anchildress1/system-notes/issues/14)) ([1faf3aa](https://github.com/anchildress1/system-notes/commit/1faf3aa9dce353c453fce03b160b830dca94e753))
* **web:** align chat styling and update index configuration ([714e6c1](https://github.com/anchildress1/system-notes/commit/714e6c1ddec72e27a2275310521af39899c92b1b))
* **web:** finalize Ruckus chat UI with premium glassmorphic styling and custom components ([da3d007](https://github.com/anchildress1/system-notes/commit/da3d007289b646329da191a65b43cdbd143a4ad5))
* **web:** replace footer text links with accessible icons ([#13](https://github.com/anchildress1/system-notes/issues/13)) ([93becd5](https://github.com/anchildress1/system-notes/commit/93becd598992e229e958ba3085143899f740c811))


### Bug Fixes

* address PR [#12](https://github.com/anchildress1/system-notes/issues/12) review comments and resolve test failures ([d56e544](https://github.com/anchildress1/system-notes/commit/d56e544f422a2e3b7a042ce22cc199b337c246b3))
* **algolia:** correct synonyms upload method in deploy script ([5bf7f30](https://github.com/anchildress1/system-notes/commit/5bf7f305f10187fbe6a6d1647570dd4118ebfe89))
* **api:** decouple algolia source files and remove unused docs endpoint ([867e87d](https://github.com/anchildress1/system-notes/commit/867e87d6a3133446a5d8d3011189147392970a73))
* **api:** enforce strict path validation security rules ([1511030](https://github.com/anchildress1/system-notes/commit/15110308750d8ece1b1942426f9d20770ae111f2))
* **api:** implement library-based path sanitization (Werkzeug) ([4722532](https://github.com/anchildress1/system-notes/commit/47225327a36c0875e98b17929e9ee457cd9339e0))
* **api:** resolve path traversal vulnerability ([d29d37f](https://github.com/anchildress1/system-notes/commit/d29d37fe0722c0f3e10f6badb21d8ca419761cf4))
* **build:** add rollup linux optional dependency ([c86ec53](https://github.com/anchildress1/system-notes/commit/c86ec53e807f2a44068edf7a60fc377b5f497725))
* chat transparency and unclickable close functionality ([47b5c66](https://github.com/anchildress1/system-notes/commit/47b5c66c80307d704c54e2f82e408e411b875780))
* **chat:** fix empty bubbles and update send button style ([e6c85ac](https://github.com/anchildress1/system-notes/commit/e6c85acdf1b05b9db9da5902321e042ebf43f161))
* **ci:** prevent hangs in lighthouse and playwright ([ae7ec57](https://github.com/anchildress1/system-notes/commit/ae7ec572081ca4e260403d4f96901a4624f7efe9))
* **ci:** use npm start for lighthouse ci to fix static asset loading ([dc1d9aa](https://github.com/anchildress1/system-notes/commit/dc1d9aa8d8881d0317d939e1eedc7d094de680a4))
* configure search metrics ([#20](https://github.com/anchildress1/system-notes/issues/20)) ([78a29f1](https://github.com/anchildress1/system-notes/commit/78a29f1d4c4a9d584ef60d4b2cb3fd9870a423b3))
* **css:** enable pointer-events for AIChat container and input ([0dc29e1](https://github.com/anchildress1/system-notes/commit/0dc29e12e4a6ce8a162335efb6ca961321d7b834))
* **deps:** bump react to 19.2.4 to resolve mismatch ([e0946d8](https://github.com/anchildress1/system-notes/commit/e0946d80901eefcd6a611f97ad86b4370b18176d))
* **e2e:** update homepage expectation to match new hero content ([d87e61c](https://github.com/anchildress1/system-notes/commit/d87e61c43b15987f3528d494c533210b8f2c747e))
* **e2e:** use npm start for playwright webServer to fix static asset loading ([a1e684c](https://github.com/anchildress1/system-notes/commit/a1e684ccda586e0c2719d18efb38404f2e187a1b))
* mobile music blog btn and performance ([#6](https://github.com/anchildress1/system-notes/issues/6)) ([1d5e096](https://github.com/anchildress1/system-notes/commit/1d5e09636054885bd493dedf26a0f63742388bde))
* normalize fact schema keys and update deployment config ([60ebc36](https://github.com/anchildress1/system-notes/commit/60ebc36bb31237b4619ac74ac95aa232d8b88f7f))
* **prompt:** restore ruckus voice while keeping contract ([c05a4cf](https://github.com/anchildress1/system-notes/commit/c05a4cfa8144c905f2cde77f413aae7cad034774))
* resolve json viewer fetch error and enforce read-only mode ([3cc9635](https://github.com/anchildress1/system-notes/commit/3cc96357d766a9ffad06f709a298da2f68c8f7ff))
* resolve PR review feedback and clean up tests ([80cb769](https://github.com/anchildress1/system-notes/commit/80cb769111db3af9c22ea5b87fae81b8c36d71d9))
* **security:** enhance path validation and fix web linting ([3eca935](https://github.com/anchildress1/system-notes/commit/3eca93575b7d412e91693ae050636f5f991d431a))
* **security:** resolve CodeQL path traversal and info leak ([28ba5c1](https://github.com/anchildress1/system-notes/commit/28ba5c1a2ffff1380251f2408b9b60bdc109606a))
* **security:** resolve CodeQL path traversal and info leak ([e7c339e](https://github.com/anchildress1/system-notes/commit/e7c339e559441f11b711df397579c37caa13f2ab))
* **test:** remove redundant build in playwright config ([03cebcb](https://github.com/anchildress1/system-notes/commit/03cebcb66e50a351f6ed24ab63b27583b14a6b53))
* **tests:** remove flaky AI readiness test and fix robots.txt casing ([4892551](https://github.com/anchildress1/system-notes/commit/4892551fa41f5f42ce6bafad8b54e2508f3284f6))
* **ui:** correct chat window layout and sizing constraints ([3235253](https://github.com/anchildress1/system-notes/commit/323525362273c05dac9f654f4fb6c108589691e5))
* **web:** add accessible label to chat toggle button ([8c18a48](https://github.com/anchildress1/system-notes/commit/8c18a4808881a090d30718c52ba8258a24378b3d))
* **web:** copy static assets for standalone lighthouse tests ([c1ac655](https://github.com/anchildress1/system-notes/commit/c1ac65522c19e402caf44ab6984200f083d224d4))
* **web:** fix reversed text on flip cards in expanded view ([f92dee2](https://github.com/anchildress1/system-notes/commit/f92dee254cbc4843e507ca2362814d59a84dd5d1))
* **web:** resolve chat 422 error by simplifying component structure ([45a850f](https://github.com/anchildress1/system-notes/commit/45a850f15ac8a61d9cb77cff4c8b96bc9d8055cd))
* **web:** resolve overlapping elements blocking interaction ([f05549d](https://github.com/anchildress1/system-notes/commit/f05549da75138cf6162d4377f91efe892150421b))
* **web:** resolve post-rebase regressions and lint errors ([ab233c8](https://github.com/anchildress1/system-notes/commit/ab233c80774406edb7f5d2f29f67e658bd94085d))
* **web:** resolve React DOM attribute warnings in tests ([efa8909](https://github.com/anchildress1/system-notes/commit/efa8909e2f40c36a83b3cbdef296136cc3d7c4ee))


### Miscellaneous Chores

* release 1.0.0 ([8209e91](https://github.com/anchildress1/system-notes/commit/8209e918fd4313e22c33e84499f01f8c4b2dbe00))

## [1.2.0](https://github.com/anchildress1/system-notes/compare/system-notes-v1.1.0...system-notes-v1.2.0) (2026-01-28)

> _In which we pretend that adding a music player counts as "system architecture"._

We released version 1.2.0, primarily because the commit history was getting embarrassed by how long it had been since the last tag. This update brings a music player — because nothing says "serious technical documentation" like background beats — and a comprehensive UI overhaul that hopefully distracts from the backend complexity. We also fixed a litany of CORS issues that I am choosing to believe were caused by cosmic rays rather than my own configuration errors.

<details>
<summary>The boring technical details that you probably don't read</summary>

### Features

- add music player, update about page, and make hero text interactive ([8083e0f](https://github.com/anchildress1/system-notes/commit/8083e0f99af80a6abb24a6e7ed41ab2da64ef1c6))
- **docs:** overhaul README and add architecture docs ([#3](https://github.com/anchildress1/system-notes/issues/3)) ([a376713](https://github.com/anchildress1/system-notes/commit/a37671396065cfb475ed4ab03c0ea17b3bfa89af))
- enhance sparkle effects and add comprehensive test coverage ([b3a57fa](https://github.com/anchildress1/system-notes/commit/b3a57faf3e3705192e0b64d1036d7b739ec08022))
- integrate persona content and add UI benchmarks ([03927e0](https://github.com/anchildress1/system-notes/commit/03927e051d06e5310b4d55d51f9205b17a830d3b))
- make footer non-sticky and finalize UI V4 polish ([edc1295](https://github.com/anchildress1/system-notes/commit/edc1295321cd44239eedfa3eabc7ab4d01ebc58c))
- multi-region deployment, interactive heroes, and music player polish ([f3edb82](https://github.com/anchildress1/system-notes/commit/f3edb82d8a95146564f61f0f767fcb5a1cb7c61d))
- optimize ruckus poc, fix formatting, and secure backend ([e92ccb1](https://github.com/anchildress1/system-notes/commit/e92ccb129905ccaed22d5c0e0b85981cf156dad9))
- replace chat icon with Google Smart Toy and update project data ([fc618cd](https://github.com/anchildress1/system-notes/commit/fc618cd9b763b772faf192cfd6fbe200bd85b3cb))
- sync project narratives to permanent system prompt injection ([5eb3e58](https://github.com/anchildress1/system-notes/commit/5eb3e5874ffdac0b5bf3d60188d7040ed264de6e))
- sync project narratives to system prompt and prepare for deployment ([85f2881](https://github.com/anchildress1/system-notes/commit/85f2881c6021c35d38e1faa815fec0e42cc05e4f))
- turbo config, seo, and build fixes ([65fef25](https://github.com/anchildress1/system-notes/commit/65fef25b815c2c992331683d400595eb2d01fd30))
- **ui:** add Hero section and About page ([4b13df1](https://github.com/anchildress1/system-notes/commit/4b13df1fae9b0f2b89045f970de64850ffb0d0e8))
- **web:** add docker and cloud run deployment setup ([0d07aa9](https://github.com/anchildress1/system-notes/commit/0d07aa9d875e4cc2fdf850960c21ad987779b60c))
- **web:** enforce image aspect ratio and fix lint ([2604b46](https://github.com/anchildress1/system-notes/commit/2604b46a37b43e3706520b4c4db0e9f6e1e3a030))
- **web:** implement mobile responsiveness and performance benchmarks ([b5dacff](https://github.com/anchildress1/system-notes/commit/b5dacff1eb03ca37f58d266ac729ca207e4ef161))
- **web:** overhaul UI with fluid animations & rai-lint banner ([f3a2858](https://github.com/anchildress1/system-notes/commit/f3a28583f5c334bf38ecd0ed70e98d7a770db0f9))
- **web:** redesign expanded view and update project data ([93312c5](https://github.com/anchildress1/system-notes/commit/93312c560ad24af9aa79f0884c3391a8ca2c01fd))
- **web:** refine UI with 1.91:1 cards, centralized intro, and unified 'gray' palette ([536aa0c](https://github.com/anchildress1/system-notes/commit/536aa0cdd9c0f1574174aab4b0789d6f4f8a848e))
- **web:** scrollable banner and image optimization ([b01a7a8](https://github.com/anchildress1/system-notes/commit/b01a7a8c869f4160b367f9abcf5202fee9656d17))
- **web:** update UI with split project grids and modal details ([d24bba0](https://github.com/anchildress1/system-notes/commit/d24bba0bd64958bd9940e1df021ac9e23cc8cb46))

### Bug Fixes

- **agent:** inject API URL via env var to resolve connection error ([b51e231](https://github.com/anchildress1/system-notes/commit/b51e231706a0442dc6c303eba8b6a9454b8b1914))
- **api:** disable CORS credentials to allow wildcard origins ([1713a38](https://github.com/anchildress1/system-notes/commit/1713a384feec458ed12aeff3c1bb15b735afbd57))
- **api:** use explicit CORS origins with credentials ([0529a4b](https://github.com/anchildress1/system-notes/commit/0529a4b30222eec34187c468dbed6b42c2343142))
- **cloud-run:** finalize CORS fix and restore backend tests ([07e341c](https://github.com/anchildress1/system-notes/commit/07e341c20bda3dfa00054dd9b4cfe8ba7d175027))
- **cloud-run:** resolve agent chat connectivity issues ([6874522](https://github.com/anchildress1/system-notes/commit/6874522e2c0f8b2e7b86b7a5d6e16cd9f7c29428))
- mobile music blog btn and performance ([#6](https://github.com/anchildress1/system-notes/issues/6)) ([69f0c7d](https://github.com/anchildress1/system-notes/commit/69f0c7d46c393b879c4f07e3c2c0136716a1216e))
- **ops:** remove duplicate deploy labels and enforce pre-push tests ([f624e4e](https://github.com/anchildress1/system-notes/commit/f624e4e0dd1f380d499d4069a63d340e1c389a07))
- optimize images using next/image and improve color contrast ([416ef5c](https://github.com/anchildress1/system-notes/commit/416ef5c6113839e5b634d7531e4b70e75bd0b167))
- **perf:** optimize expanded view animation and verify bundle ([435c481](https://github.com/anchildress1/system-notes/commit/435c481550d7b6a6104cd3f19f875276fba3e1a7))
- resolve accessibility issues and update lint configuration ([59180c0](https://github.com/anchildress1/system-notes/commit/59180c08bf103fd653e73b6bd8396eb258490706))
- resolve chat 400 error and enable dynamic about page data load ([5c8aaaf](https://github.com/anchildress1/system-notes/commit/5c8aaaf6bdcad0a2ae3b50b34688791b84cebcb8))
- resolve hydration issues, about page data structure, and model revert ([d943935](https://github.com/anchildress1/system-notes/commit/d9439358d1c2380ba7b86c75e9fd2520b8062441))
- resolve hydration issues, chat focus, and update project data/docs ([5efdd09](https://github.com/anchildress1/system-notes/commit/5efdd09e4de79c2b75487ed65eb4da7359ff6198))
- SEO, AI, and more testing ([#1](https://github.com/anchildress1/system-notes/issues/1)) ([8dd0c6e](https://github.com/anchildress1/system-notes/commit/8dd0c6ec7e2dc55a948a05ddb6204a464a672245))
- **ui:** replace morph animation with stable scale/fade modal ([0987061](https://github.com/anchildress1/system-notes/commit/09870611b07a60de8a99fc55448f7d0799bcf265))
- **ui:** resolve footer overlap and alignment issues ([672b645](https://github.com/anchildress1/system-notes/commit/672b6451895286c5de4ab5d7aa67bcdf348ff4ca))
- **ui:** update chatbot icon to GiBrainDump, fix focus colors, and optimize expanded view animation ([5f942ec](https://github.com/anchildress1/system-notes/commit/5f942ecbe13af9be28064197bb16aca9b088f5a6))
- **web:** resolve dynamic import build error and update prompts ([7f20107](https://github.com/anchildress1/system-notes/commit/7f2010790a70f47c7fa82c6ecbec327b9a959955))

### Performance Improvements

- **web:** optimize ExpandedView rendering and animations ([e484cd2](https://github.com/anchildress1/system-notes/commit/e484cd271336dd61be1d9987e7697f4a794331ac))

</details>

## [1.1.0](https://github.com/anchildress1/system-notes/compare/v1.0.0...v1.1.0) (2026-01-24)

### Features

- **docs:** overhaul README and add architecture docs ([#3](https://github.com/anchildress1/system-notes/issues/3)) ([a376713](https://github.com/anchildress1/system-notes/commit/a37671396065cfb475ed4ab03c0ea17b3bfa89af))
