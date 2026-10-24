# Changelog

## [1.6.2](https://github.com/AIssoufi/issoufi.fr/compare/v1.6.1...v1.6.2) (2026-10-24)


### Bug Fixes

* **app:** show the not found page for a path with capitals ([f1de8fe](https://github.com/AIssoufi/issoufi.fr/commit/f1de8fed60dc84964bcca63973cfc5695180409e))
* **header:** keep the menu links inactive on a path with capitals ([4060aa1](https://github.com/AIssoufi/issoufi.fr/commit/4060aa1f094616475e23318e7f6357c4f35d50a0))


### Performance

* **fonts:** cache the web fonts for a year under hashed names ([432fe6d](https://github.com/AIssoufi/issoufi.fr/commit/432fe6df1456360f12433d25a3c60b66c42bc48e))


### Code Refactoring

* **ci:** export the quote and indentation readers of the YAML helpers ([5b60435](https://github.com/AIssoufi/issoufi.fr/commit/5b60435959a500c05aed59a9f6bb2bef585570fe))
* **ci:** split the bundle helpers into one module per topic ([03d50d7](https://github.com/AIssoufi/issoufi.fr/commit/03d50d7bedf6ac7ea3167a2937f62045ae282106))
* **vite:** move escapeRegExp up to the helpers shared by every Vite config ([c5bdf3e](https://github.com/AIssoufi/issoufi.fr/commit/c5bdf3edc2aac5b5619572ee2534be99c51ba3c9))
* **vite:** split the config helpers into one module per topic ([da7c6c5](https://github.com/AIssoufi/issoufi.fr/commit/da7c6c5fbc2b02af2b732b04d228899b4c32492d))


### Documentation

* **ai-workflow:** describe the slot handoff between masters ([f7de321](https://github.com/AIssoufi/issoufi.fr/commit/f7de321d5be81ec2be11f924bc073238efdd7eb7))
* **ai-workflow:** describe when a master parks a worker during its CI ([1480638](https://github.com/AIssoufi/issoufi.fr/commit/14806386368fda9a7b3440bb2d5f37726622bdcc))
* **decisions:** ask for the date line of each step of the evolution ([0374473](https://github.com/AIssoufi/issoufi.fr/commit/03744730684aedd6c96a1e9fb2e9d0c1d748bf41))
* **decisions:** record the hashed web fonts cached a year ([2459847](https://github.com/AIssoufi/issoufi.fr/commit/24598477eba083ff9c8dd30a07077770ee1434bc))
* describe the check of the images of the jobs next to that of the actions ([bde8f5d](https://github.com/AIssoufi/issoufi.fr/commit/bde8f5d7d918c56483ecd930a31e7d2765bfb18a))
* **evolution:** date the measures of each step ([53156e7](https://github.com/AIssoufi/issoufi.fr/commit/53156e77d791a89916fbe53fee49b1c7d4e5f27f))
* record the phone browser tests in WebKit ([b297dbf](https://github.com/AIssoufi/issoufi.fr/commit/b297dbf95d065c4c097df7fc5190204f63be115b))
* record the WebKit tests in the image of Playwright ([a1b42c5](https://github.com/AIssoufi/issoufi.fr/commit/a1b42c5d4fef35321f055ff71c586001c35cda43))
* say what to do when the Playwright image check fails ([1adef09](https://github.com/AIssoufi/issoufi.fr/commit/1adef091d9f3d87fd9f294d4ba8d876f8c44f3d3))
* **testing:** say how a browser test waits for the page to load ([2902034](https://github.com/AIssoufi/issoufi.fr/commit/2902034208370130dd9a4666d6e16845e5f18cb7))
* **testing:** say that the preview serves the not found page as Cloudflare does ([e126404](https://github.com/AIssoufi/issoufi.fr/commit/e12640457aa7ab12affe1cbba1ca909650bdbbf8))
* **testing:** say which cache policy pnpm preview sends ([2d23ded](https://github.com/AIssoufi/issoufi.fr/commit/2d23ded54d36096ea6d09019139875b3eb0d2220))
* **testing:** say which redirects of Cloudflare pnpm preview answers ([57c8b6e](https://github.com/AIssoufi/issoufi.fr/commit/57c8b6e2e666f9bd8ec95b6a78b20900f6df30b3))

## [1.6.1](https://github.com/AIssoufi/issoufi.fr/compare/v1.6.0...v1.6.1) (2026-10-23)


### Code Refactoring

* **ci:** move getErrorMessage to a module of its own ([3eed244](https://github.com/AIssoufi/issoufi.fr/commit/3eed244742d6a3af72845c576a7795c76e6e2447))
* **ci:** move the approval of held runs to their own module ([f2be9f9](https://github.com/AIssoufi/issoufi.fr/commit/f2be9f9894b8057d8c7156900a8cde043b8c1b90))
* **ci:** read caught errors with getErrorMessage in six scripts ([7109766](https://github.com/AIssoufi/issoufi.fr/commit/7109766e6ed7f9deabe58940950c59f1b3d40081))
* **ci:** share the YAML key reader of the action pin check ([2436f66](https://github.com/AIssoufi/issoufi.fr/commit/2436f66e854113b0512a23810b05d15b61dd9c58))
* **ci:** split the daily release by topic ([4aa9985](https://github.com/AIssoufi/issoufi.fr/commit/4aa9985ad97b61612f4cc59d5b35ad4446fc7bd2))
* **cv:** stop exporting two constants that only their own file uses ([b78c1f3](https://github.com/AIssoufi/issoufi.fr/commit/b78c1f32f3be795763242bb68a7e83dac3ef3791))
* stop exporting the constants that only their own file reads ([8bdb6dc](https://github.com/AIssoufi/issoufi.fr/commit/8bdb6dc9cd0dbed5a2b7dc33234c94f052e69657))


### Documentation

* describe the check of the action pins ([0d091c1](https://github.com/AIssoufi/issoufi.fr/commit/0d091c124be459ae97756b84242c582dfa6f8b8a))
* describe the mocks and assertions of Vitest 5 in the test pitfalls ([78b4d1c](https://github.com/AIssoufi/issoufi.fr/commit/78b4d1c63d357341f952ee8639549677a86dcd83))
* describe the retry of release-please and the check of checkout credentials ([1253ab7](https://github.com/AIssoufi/issoufi.fr/commit/1253ab76236edfe0d3db2ee7bab18598e03199b1))
* list pnpm knip in the scripts of the development guide ([18cc9e1](https://github.com/AIssoufi/issoufi.fr/commit/18cc9e16264f43e023507bd27b68e66634b53d82))
* name the workflows whose held runs the daily release approves ([7bf17fa](https://github.com/AIssoufi/issoufi.fr/commit/7bf17fa7688ccb0cf6a78fd63659a76fedca70bb))
* record the decision to report unused code with knip ([f3a2016](https://github.com/AIssoufi/issoufi.fr/commit/f3a201626e8d163ecad132e191207eae0b5db4de))
* record the decision to take the libraries of Chromium from the runner image ([2ace00a](https://github.com/AIssoufi/issoufi.fr/commit/2ace00a41dbb7b235040c87ceb62ab32ac70b184))
* record the update to Vitest 5 ([db17150](https://github.com/AIssoufi/issoufi.fr/commit/db17150eff462e4e36f049582426044c29a195fe))
* refresh the README screenshot of the home page ([d86c127](https://github.com/AIssoufi/issoufi.fr/commit/d86c127c18c261c9c2ab0503c0cbb7332e3f156e))
* run a spec of a child process once with forced colors ([a3189b8](https://github.com/AIssoufi/issoufi.fr/commit/a3189b81add92900a2309fec5be03bf6107d639f))

## [1.6.0](https://github.com/AIssoufi/issoufi.fr/compare/v1.5.0...v1.6.0) (2026-10-21)


### Features

* **projects:** link the chess, calculator, Connect Four, Kane and Pedalboards demos ([5977b7e](https://github.com/AIssoufi/issoufi.fr/commit/5977b7ed481c2cb44b6194154d1589b430b0a7d8))
* **projects:** list the current tools of the Pedalboards project ([a85b245](https://github.com/AIssoufi/issoufi.fr/commit/a85b245efe80a670a0429cbd3d7e1f46fe2b7df1))


### Code Refactoring

* remove the unused Forbidden page and the App barrel ([e3d8dee](https://github.com/AIssoufi/issoufi.fr/commit/e3d8deebe8b3e05d4f3b722f4e31d2b156ce02e1))


### Documentation

* describe the tools of the agents in this repository ([401845e](https://github.com/AIssoufi/issoufi.fr/commit/401845ed6156865d1e1c4701e4977d2cddb42e21))
* record the locked wrangler and the pinned actions ([5c6bac7](https://github.com/AIssoufi/issoufi.fr/commit/5c6bac785950d8413885a556e0d97b1ddae7ea5d))
* record the update to pnpm 12 ([5bb2936](https://github.com/AIssoufi/issoufi.fr/commit/5bb293683df98d0ed0b731e18a968b929ab56304))
* record the update to TypeScript 6 ([4c7e5da](https://github.com/AIssoufi/issoufi.fr/commit/4c7e5da4330127751c65ae192b7fcc1b2be19739))
* say where the worktree of a ticket lives ([b9632f9](https://github.com/AIssoufi/issoufi.fr/commit/b9632f9a40a8c2b21d0c3a0953b20a406fed1101))

## [1.5.0](https://github.com/AIssoufi/issoufi.fr/compare/v1.4.2...v1.5.0) (2026-10-20)


### Features

* **cv:** give the professional address and the city in the contacts of the CV ([2e8b04d](https://github.com/AIssoufi/issoufi.fr/commit/2e8b04d421c9595236816f85f2290657ec6b73ea))
* **cv:** justify the paragraphs, bullet points and skills of the CV ([0fdf5da](https://github.com/AIssoufi/issoufi.fr/commit/0fdf5dac382d4de97652c34103157b8c9cad228e))
* **cv:** keep each role of the CV on one page and no word alone on a line ([57e6310](https://github.com/AIssoufi/issoufi.fr/commit/57e631011cccc417e45be58950a052aec0e51107))
* **cv:** leave the subtitle of the home page out of the CV ([012bb7e](https://github.com/AIssoufi/issoufi.fr/commit/012bb7e93cf9ccf563a6d8f8740ca3faf1f74f1c))
* **cv:** name the projects and the degrees without their details ([ef727cc](https://github.com/AIssoufi/issoufi.fr/commit/ef727cc043147037fa239125883899481c408644))
* **cv:** name the role in the document information of the CV ([3f9d4ea](https://github.com/AIssoufi/issoufi.fr/commit/3f9d4ea858769ebbd3e0a98ed649382a17c53ed4))
* **cv:** open the CV with a profile and the skills grouped by category ([e25e913](https://github.com/AIssoufi/issoufi.fr/commit/e25e91367a18dc198809faadc1de8ad5236fd7f9))
* **cv:** show an icon before each contact detail of the CV ([c8b03f8](https://github.com/AIssoufi/issoufi.fr/commit/c8b03f852d6e2f4e325bbbc895e713ad2c040359))
* **cv:** write the CV in a larger and more contrasted text ([9dde324](https://github.com/AIssoufi/issoufi.fr/commit/9dde3243c18e76341685337a9572d3944ab30a0a))
* **experiences:** enrich the UI Kit and Core roles with the facts of their owner ([e7138f1](https://github.com/AIssoufi/issoufi.fr/commit/e7138f155bc880ca899eb0323e43527f1fe86b33))


### Bug Fixes

* **cv:** leave the theme of the UI Kit role out of the CV ([9cec94c](https://github.com/AIssoufi/issoufi.fr/commit/9cec94c9c17e446d94f9650e174e15428bc1ce6a))
* **cv:** read the bullet points of the CV in the order of the page ([7858c7b](https://github.com/AIssoufi/issoufi.fr/commit/7858c7b8aabf7c7f050100e98f2edb8b4e72ecda))
* **cv:** separate the dates of a period with an en dash ([bcb7b38](https://github.com/AIssoufi/issoufi.fr/commit/bcb7b389f6b4cdd7d4f9ffeb1124631ba18c0b44))
* **experiences:** count the approved merge requests of every author ([7e88e3e](https://github.com/AIssoufi/issoufi.fr/commit/7e88e3ec6853cbb14c3265410c3408f1ef97ba56))


### Performance

* **build:** minify the CSS templates of the app ([05a3731](https://github.com/AIssoufi/issoufi.fr/commit/05a37310af8cb0e1f2c868b31893b08dbe0ac86d))
* **i18n:** load the texts of a lazy page with its chunk ([f3f70c7](https://github.com/AIssoufi/issoufi.fr/commit/f3f70c79b76a442f1004ee123e73e52f32173796))


### Code Refactoring

* **cv:** move the constants of the file formats next to the helpers that read them ([e441f6b](https://github.com/AIssoufi/issoufi.fr/commit/e441f6b2c54fb3e22a7004ada761adc29e9aa555))
* **cv:** name the conditions that read the trailer of the PDF and the data files ([3ef32ac](https://github.com/AIssoufi/issoufi.fr/commit/3ef32ac47e36f3edbc42c0440583596e3528d38f))
* **cv:** share the readers of the data of the CV ([6318021](https://github.com/AIssoufi/issoufi.fr/commit/63180211db9de6fb49df41257e9e953b818e0a24))

## [1.4.2](https://github.com/AIssoufi/issoufi.fr/compare/v1.4.1...v1.4.2) (2026-10-20)


### Documentation

* link the evolution page and state the rule of the decision records ([d7d8ff6](https://github.com/AIssoufi/issoufi.fr/commit/d7d8ff668e6253a43e0d29bc3ed44f0f14f95397))
* record the past tool changes in decision records ([d2624f6](https://github.com/AIssoufi/issoufi.fr/commit/d2624f68bda233ea6a5ac708cbc6e0606cb80180))
* renumber the decision on the deploy trigger as 0016 ([0d5dccc](https://github.com/AIssoufi/issoufi.fr/commit/0d5dccc9cd7b98c2e23a83caf8f7ed108b1cd795))
* tell the evolution of the tools era by era ([87f49ef](https://github.com/AIssoufi/issoufi.fr/commit/87f49eff20850539a2ca46f0ab24949257053b7b))

## [1.4.1](https://github.com/AIssoufi/issoufi.fr/compare/v1.4.0...v1.4.1) (2026-10-20)


### Documentation

* record the decision to start the daily deploy from a Cloudflare Worker ([1806dbb](https://github.com/AIssoufi/issoufi.fr/commit/1806dbbaf30d3b3f7b92ffb05e0257b3e1cca981))
* split the AI workflow documentation into one file per topic ([a7950ef](https://github.com/AIssoufi/issoufi.fr/commit/a7950efaf089070adf5b2b527f2a211c862e4943))

## [1.4.0](https://github.com/AIssoufi/issoufi.fr/compare/v1.3.0...v1.4.0) (2026-10-20)


### Features

* **header:** open the mobile menu without JavaScript ([803f178](https://github.com/AIssoufi/issoufi.fr/commit/803f1783f4c41f5c5d144b3e824f462f492196b3))
* **header:** switch the language with links that work without JavaScript ([ac4dc06](https://github.com/AIssoufi/issoufi.fr/commit/ac4dc0665eae1a192cffe78d816532549c9bf80d))
* render each page at build time and hydrate it ([a6384df](https://github.com/AIssoufi/issoufi.fr/commit/a6384df414a6f22d0d95f24d72fce92d51362664))


### Bug Fixes

* draw the text of the buttons in the font of the site ([e2f79ff](https://github.com/AIssoufi/issoufi.fr/commit/e2f79ffc53f1c62cc482df30eb59fd7409e66a46))
* **home:** tighten the line height of the big words of the title ([1c9a6c9](https://github.com/AIssoufi/issoufi.fr/commit/1c9a6c99e04a2caa162acd18f780477b9f94e32f))
* keep the buttons and links still on hover with reduced motion ([18a583f](https://github.com/AIssoufi/issoufi.fr/commit/18a583fca6ddb50fa9a6c684b42872a541d27ff5))
* keep the dot between the tools of a project at the end of a line ([722c233](https://github.com/AIssoufi/issoufi.fr/commit/722c23344a234963f8b6758e4f6db3d9f162ef24))
* keep the job cards still on hover with reduced motion ([0e7be03](https://github.com/AIssoufi/issoufi.fr/commit/0e7be03d8a52add5c43e49bd65db8e50334e54de))
* keep the state badge of a project inside its card on narrow phones ([cacb8d5](https://github.com/AIssoufi/issoufi.fr/commit/cacb8d59c73979dc130b23e76d1926ccdd3ec727))
* **projects:** let a visitor without JavaScript reach every project ([fbb58e7](https://github.com/AIssoufi/issoufi.fr/commit/fbb58e7b4a52c955b3e5533091339bfabb18e1e2))
* **projects:** replace the Trouillet Décors thumbnail with a sharp capture ([9ad488d](https://github.com/AIssoufi/issoufi.fr/commit/9ad488d8ade925ef62cd881d944f5cf1dd2d735c))
* scale the logo of the header up again when a mouse hovers it ([a6d182e](https://github.com/AIssoufi/issoufi.fr/commit/a6d182e2361ab6b7520c9fed17a40467436186f3))
* show the carousel arrows of the projects in forced colors mode ([5417ef7](https://github.com/AIssoufi/issoufi.fr/commit/5417ef750418e899f63d562b28631ac8b1b175c2))
* show the download icon of the CV link in forced colors mode ([fc2cd0f](https://github.com/AIssoufi/issoufi.fr/commit/fc2cd0ff069f370a02398a1c123604bfda9ae0e9))
* start the name of the language buttons with their visible text ([7270e36](https://github.com/AIssoufi/issoufi.fr/commit/7270e362438e28f20051c3bf733173724f8334e8))


### Performance

* download the project thumbnails below the first one at a low priority ([6fe830c](https://github.com/AIssoufi/issoufi.fr/commit/6fe830c53f83d298a89e8880690b45f9955a6f72))
* download the scripts and the background photo of a rendered page at a low priority ([8ba522b](https://github.com/AIssoufi/issoufi.fr/commit/8ba522b359756d01b39fef0983ed8d26734c2c8d))
* draw the logo of the header as its outline instead of loading its font ([00e43cb](https://github.com/AIssoufi/issoufi.fr/commit/00e43cbfb66de5bfdbcf1e879a1aef65b5510afe))
* give the project thumbnails the width they are drawn at in sizes ([8387955](https://github.com/AIssoufi/issoufi.fr/commit/8387955b471c6b39602f798289bc1fa0ec3515bf))


### Code Refactoring

* count job durations up to a given date ([6c0ee91](https://github.com/AIssoufi/issoufi.fr/commit/6c0ee91751c9b45f86054175aeda5686a83c587b))
* drop the font workaround of the status page button ([347ab5e](https://github.com/AIssoufi/issoufi.fr/commit/347ab5ed0ba8b622f49dd65dd5ce6e8f627dd606))
* **header:** draw the bars of the burger in a BurgerIcon component ([a21a558](https://github.com/AIssoufi/issoufi.fr/commit/a21a558eb913ecf764123aa2d94e9724366c85c3))
* name the extension of every relative import ([6dce7d0](https://github.com/AIssoufi/issoufi.fr/commit/6dce7d0b5964eba493fe70f79e5269a061c31200))
* name the heights of the project thumbnails in the theme ([164c4e4](https://github.com/AIssoufi/issoufi.fr/commit/164c4e47756e7f51094585d0b550941b3d596643))
* name the hover scale of the controls ([bb9e531](https://github.com/AIssoufi/issoufi.fr/commit/bb9e531250aae62c1abc25de4c7f1d0060b9723d))
* name the media query of forced colors mode ([051b3d8](https://github.com/AIssoufi/issoufi.fr/commit/051b3d857f6f002a086498cada6060f844981595))
* **projects:** count the whole cards of a row from its first card shown ([e60c307](https://github.com/AIssoufi/issoufi.fr/commit/e60c3078d4d8e357e4e86d267324ede2ef76f31d))
* render what depends on the visitor once the page is hydrated ([8391df7](https://github.com/AIssoufi/issoufi.fr/commit/8391df749e12350e6bae96648053de6c07575270))
* share the helper that shows every project in the browser tests ([502a3d2](https://github.com/AIssoufi/issoufi.fr/commit/502a3d27a458d75e5015fe2ef72b92f3d204635e))
* start the cursor glow off the screen in its style ([8f10e81](https://github.com/AIssoufi/issoufi.fr/commit/8f10e81bb88ac795fc298aceffc97b4651bac7e0))


### Documentation

* describe the download priorities of the first paint ([d2112a8](https://github.com/AIssoufi/issoufi.fr/commit/d2112a885079f7a76df1ddfa5e390bdc71c549ca))
* describe the projects page without JavaScript ([9425244](https://github.com/AIssoufi/issoufi.fr/commit/94252445df5114111c2651af4ffe0552f5e20b4e))
* describe the redirects of the production site ([5691663](https://github.com/AIssoufi/issoufi.fr/commit/5691663c0682c80db0664192174cac0745b974a1))
* note that an icon sets no stroke color of its own ([9ac5d7f](https://github.com/AIssoufi/issoufi.fr/commit/9ac5d7f9e7bf539e4a16a26f0b6f1c30a84d776e))
* say how a change of size stays still with reduced motion ([cf84a39](https://github.com/AIssoufi/issoufi.fr/commit/cf84a394be62598041f4c26d150a8476f53d4d5b))
* say that the header draws the logo as its outline ([acc513b](https://github.com/AIssoufi/issoufi.fr/commit/acc513bcd4d2ba8bb420574383df17e3aa4b8ce8))
* say that what depends on the visitor waits for the hydration ([0f50bc1](https://github.com/AIssoufi/issoufi.fr/commit/0f50bc1da12b66a6205d3c669c9199587a804a61))

## [1.3.0](https://github.com/AIssoufi/issoufi.fr/compare/v1.2.0...v1.3.0) (2026-10-19)


### Features

* add a skip link to the content of every page ([ad1ff57](https://github.com/AIssoufi/issoufi.fr/commit/ad1ff57509021e0288a8cf294f20917d424ed6e1))
* enlarge the buttons of the home page on wide screens ([1a7e884](https://github.com/AIssoufi/issoufi.fr/commit/1a7e884595a3faa1148f1679cb8aabc834ce5f23))
* make the project cards and the links to a new tab read well with a screen reader ([cbc1b21](https://github.com/AIssoufi/issoufi.fr/commit/cbc1b21cd7ad73a6106b9da660155ac27e312918)), closes [#233](https://github.com/AIssoufi/issoufi.fr/issues/233)
* read the English job titles of the French page in English ([ae733aa](https://github.com/AIssoufi/issoufi.fr/commit/ae733aab30cb485d17c8894cc0b250f3d3af5ef6))
* scale the Experiences page up on wide screens ([019a8c3](https://github.com/AIssoufi/issoufi.fr/commit/019a8c3010b44380bbb1ef7203a5d067b28ee791))
* scale the project cards up on wide screens ([3db82bc](https://github.com/AIssoufi/issoufi.fr/commit/3db82bc90a0e94dd5257817aef91200d8d388c73))
* widen the app container on wide screens ([25de33c](https://github.com/AIssoufi/issoufi.fr/commit/25de33c97e3647f7f530053364d88ec996a8288b))


### Bug Fixes

* balance the lines of headings and of the home title ([588e484](https://github.com/AIssoufi/issoufi.fr/commit/588e484cd7e4f39a2628c732a36ad65d1b8fae30))
* give every control a target as large as a finger ([0a42d05](https://github.com/AIssoufi/issoufi.fr/commit/0a42d0528406834aae8389bbc2f3f3963bfe230c))
* hold words that belong together with no-break spaces ([0c572dc](https://github.com/AIssoufi/issoufi.fr/commit/0c572dcc0db4502cc2c9f99097129055ae864d9e))
* keep a project card flat after a tap on its like button ([4726ee1](https://github.com/AIssoufi/issoufi.fr/commit/4726ee107d765e42d6874cac33fe3722273bde78))
* keep no hover style on a control after a tap ([eef5f7d](https://github.com/AIssoufi/issoufi.fr/commit/eef5f7d45834eddd1f44bad0d0515e5d5a83a950))
* keep the dates of the timeline inside their column ([745d06c](https://github.com/AIssoufi/issoufi.fr/commit/745d06cb6cccbaf1c0b62a504258601fa6f63c42))
* keep untrusted values out of i18next nesting ([d89d5d8](https://github.com/AIssoufi/issoufi.fr/commit/d89d5d8c3ba2c9e03bc74831a5c948dff28bf170))
* leave the effects of the home page in place after a tap ([89ea87a](https://github.com/AIssoufi/issoufi.fr/commit/89ea87a7cdc6387c7a554c6cba14deee1a45cda6))
* make the tab order of the header follow the screen ([1c3a396](https://github.com/AIssoufi/issoufi.fr/commit/1c3a396c9c635ff5ce8ec0b97be31ab916bf6696))
* stack the job cards of the Experiences page at every width ([83a112b](https://github.com/AIssoufi/issoufi.fr/commit/83a112b58aab3b87f452d28c9c211853c145b150))


### Performance

* preload the chunks that a page chunk imports ([a2ca2c2](https://github.com/AIssoufi/issoufi.fr/commit/a2ca2c28986e0a24f41af92051ca4fbb640535b8))


### Code Refactoring

* drop the fallbacks that a text node never needs in e2e/text.ts ([4be90ca](https://github.com/AIssoufi/issoufi.fr/commit/4be90cab803b0ed34aefddd29474bdad3f501b9c))
* drop the fallbacks that readGlyphOutlines never needs ([62f7686](https://github.com/AIssoufi/issoufi.fr/commit/62f76867ab995bd28739b4cf7ef7284c85b1f184))
* keep the list helper of the pages in the main chunk ([c5d9951](https://github.com/AIssoufi/issoufi.fr/commit/c5d99512bd0486ce694bd57066dc5b8e77f8db24))
* leave the marked-content items out of the text of the CV PDFs ([54db731](https://github.com/AIssoufi/issoufi.fr/commit/54db7311ff3e152a85542a5073400eec9f1b8f25))
* pass named parameters to the spec helpers ([e017060](https://github.com/AIssoufi/issoufi.fr/commit/e017060dbf0492142fb37cfce58ded63ecd6a083))
* read non-blank strings with isNonBlankString everywhere ([020e05d](https://github.com/AIssoufi/issoufi.fr/commit/020e05db1b74a2863edd17e35aeb372839815832))
* render no new tab link without an address ([9c77a2f](https://github.com/AIssoufi/issoufi.fr/commit/9c77a2fc6305a4dbe8f082d0dbc0fe47e704a4c9))
* render the hidden heading of the Projects page with VisuallyHidden ([6ef1593](https://github.com/AIssoufi/issoufi.fr/commit/6ef159342faef8ac83e4bea857fbf6666b27e5ca)), closes [#220](https://github.com/AIssoufi/issoufi.fr/issues/220)
* replace the Rollup options and types that Vite 8 deprecates ([4d85044](https://github.com/AIssoufi/issoufi.fr/commit/4d850445fa61c9f509d266b2ed1d769d6ab26179))
* share listTechnologyNames between the pages ([bc4baff](https://github.com/AIssoufi/issoufi.fr/commit/bc4baff034a8db4d60db0bbc1dedfad18910f182))
* share the check of a finger pointer ([62a8328](https://github.com/AIssoufi/issoufi.fr/commit/62a83287127e4668cfdcea0b921a30ce404e60c4))
* share the focus of the page heading at the root of the app ([bc804b8](https://github.com/AIssoufi/issoufi.fr/commit/bc804b8da96eff7da65acb12c5b703e4471f0290))


### Documentation

* add the new tab link and lang convention to CLAUDE.md ([f44441d](https://github.com/AIssoufi/issoufi.fr/commit/f44441dfab6f95534ff694c5d29bcb50bcf2d808))
* correct two comments about the wide breakpoint ([9710e9a](https://github.com/AIssoufi/issoufi.fr/commit/9710e9aaeb8b58ba6d4714bafb3891fb39d9807e))
* cut the project CLAUDE.md to the rules an agent cannot guess ([d75c747](https://github.com/AIssoufi/issoufi.fr/commit/d75c747e8b50722f35edf54873ade81ab83c3a76))
* describe the screenshot comparison ([1efb469](https://github.com/AIssoufi/issoufi.fr/commit/1efb4692edfdb50baeeb0dfacb65d4d7c491c19e))
* move the testing pitfalls and checklists that only CLAUDE.md held ([c72301c](https://github.com/AIssoufi/issoufi.fr/commit/c72301c776e93ef79c4e513b53c3b63ab2f5c937))
* move the topics of the README to one short guide each ([db03281](https://github.com/AIssoufi/issoufi.fr/commit/db03281928c77b1e66fbd2f29403a0788900289b))
* point the project CLAUDE.md to the docs files ([943a647](https://github.com/AIssoufi/issoufi.fr/commit/943a647959ce0b2c25b2345831d5d7f681aed58f))
* reflow the JSDoc of the project section ([35a52a3](https://github.com/AIssoufi/issoufi.fr/commit/35a52a3b45a5a215a850247a911f2280307e352c))
* remove the duplicated entries of the changelog ([ed8e8e9](https://github.com/AIssoufi/issoufi.fr/commit/ed8e8e9f70cf5b7ba3a2b5e5bac832095299a41f))
* rewrap the JSDoc of the not found page ([8702df7](https://github.com/AIssoufi/issoufi.fr/commit/8702df7f2ce151784e849c8b266e8a10dddc0f78))
* rewrite the README as a one-page introduction ([d5ba852](https://github.com/AIssoufi/issoufi.fr/commit/d5ba852a15d85673b93c6be613f87381fd7bbd9d))
* say that the modules of the Vite configs name the .ts file of their imports ([0065239](https://github.com/AIssoufi/issoufi.fr/commit/0065239d232cf981924242deadeaa6e7d1b60e25))
* wrap the comment lines wider than 100 characters ([09a8125](https://github.com/AIssoufi/issoufi.fr/commit/09a8125272f632b68ccfa6b92adf0b2af7e234a6))

## [1.2.0](https://github.com/AIssoufi/issoufi.fr/compare/v1.1.0...v1.2.0) (2026-10-19)


### Features

* add home screen icons and a web app manifest per language ([61dd452](https://github.com/AIssoufi/issoufi.fr/commit/61dd452119a8d7d6046430c81f0337931443e32d))
* add home screen icons and favicons drawn from the logo ([99a5fb9](https://github.com/AIssoufi/issoufi.fr/commit/99a5fb987247071b235ece732d86fba81c58fe4f))
* embed the fonts in the standalone build, so it renders the same offline ([f1dbb09](https://github.com/AIssoufi/issoufi.fr/commit/f1dbb090d96c9cb67d45b404510ebdc4d948d977))
* fit the project rows to phones and tablets ([6015337](https://github.com/AIssoufi/issoufi.fr/commit/6015337772180631792c2e6b48b7e4784d7df785))
* generate the CV of each language from the content of the site ([7c6d14e](https://github.com/AIssoufi/issoufi.fr/commit/7c6d14e790cd238c57d60135d9ec02e34d3efc23))
* give each language its own installable web app manifest ([adcfa9d](https://github.com/AIssoufi/issoufi.fr/commit/adcfa9dd4ee1c82dae42f3774382b72a8cd4de6a))
* give the pages the same gutter on the right as on the left ([767a884](https://github.com/AIssoufi/issoufi.fr/commit/767a884b9c05087e635ddbceeaea014e70827971))
* **header:** show the GitHub and LinkedIn icons and a text CV link in the header bar ([fc4ada4](https://github.com/AIssoufi/issoufi.fr/commit/fc4ada4cbd78946d41a2b1555425b4a566658ed0))
* keep the project cards flat with reduced motion ([a68f6b0](https://github.com/AIssoufi/issoufi.fr/commit/a68f6b096c538f1186442f4ea3f0df7827031f51))
* move the CV button to the floating controls as a round button ([a8f30de](https://github.com/AIssoufi/issoufi.fr/commit/a8f30de75e7dda36defbf5e4971badc9300d9616))
* publish a sitemap of the pages in both languages ([624218e](https://github.com/AIssoufi/issoufi.fr/commit/624218e78e5c28e5159187e5611753c3986c1d05))
* respect the reduced motion setting of the system ([0bce353](https://github.com/AIssoufi/issoufi.fr/commit/0bce353e361ce158b35393a2ab29025b6bd07120))
* self-host the fonts and drop every request to Google ([ce0c6d6](https://github.com/AIssoufi/issoufi.fr/commit/ce0c6d66e7bd4f849a91203856ea17f7aa52d6b5))
* serve the fonts from the site instead of Google Fonts ([2939349](https://github.com/AIssoufi/issoufi.fr/commit/2939349d0272f287ab38cad981a27fe118e1c0a2))
* show a tooltip with the action on the CV buttons ([16389c7](https://github.com/AIssoufi/issoufi.fr/commit/16389c78c48b7d0c3186c465cb8d5eed4ddfca17))
* show an English link preview image on the English pages ([f34f680](https://github.com/AIssoufi/issoufi.fr/commit/f34f680951ff38d9017b804332475ba3840ce0cb))


### Bug Fixes

* center the error pages and show a background photo behind them ([f8a4244](https://github.com/AIssoufi/issoufi.fr/commit/f8a4244bd2b186713cff02f6eff5bcb3988d3e5f))
* center the error pages over a background photo and wrap a decoded long path ([97401b6](https://github.com/AIssoufi/issoufi.fr/commit/97401b62b675911f9967dc9d61a22fa8b2dd484b))
* decode the path of the not found page and wrap it inside the screen ([d6b21d8](https://github.com/AIssoufi/issoufi.fr/commit/d6b21d820d2a53d9c27c2648e933457ea72e4433))
* draw the burger icon in CSS, so it shows at once ([4830087](https://github.com/AIssoufi/issoufi.fr/commit/48300879b1f63ac1bee39446930060b4d5a6bbb7))
* **experiences:** show the periods on phones and fix what screen readers read ([be07f8d](https://github.com/AIssoufi/issoufi.fr/commit/be07f8da3f559e1f1a1ee0531b92745a89c25c94))
* fit the home hero to the screen and keep its words still near the buttons ([2526b97](https://github.com/AIssoufi/issoufi.fr/commit/2526b97364bd4dfd873efb2b595d3f35015cf51d))
* fit the home hero to the screen, from a phone held sideways to a large screen ([fab6b13](https://github.com/AIssoufi/issoufi.fr/commit/fab6b13b8ab49e51ee4e97466719a724039b6c65))
* give the end date of a role the contrast of WCAG AA ([3e4553e](https://github.com/AIssoufi/issoufi.fr/commit/3e4553e6985686feed1856796901a807b2fedb5b))
* give the rest of a wide job card to its summary column ([a2934e4](https://github.com/AIssoufi/issoufi.fr/commit/a2934e428adf19769d8798302ac6e6f96d1c9216))
* keep invisible characters encoded and cut a very long path on the not found page ([55d5695](https://github.com/AIssoufi/issoufi.fr/commit/55d56954507e0b2f2f5f16267a5bb06a9948404e))
* keep the Experiences page up when the technologies of a job are not a list ([d05d4f5](https://github.com/AIssoufi/issoufi.fr/commit/d05d4f54fbadc5dd5728804970e4ffb45afe50df))
* keep the header and the mobile menu usable while scrolling ([5434770](https://github.com/AIssoufi/issoufi.fr/commit/54347706551fa128391d7ed28f16ef0b3e43f0f5))
* keep the header on screen down to the end of every page ([da18f8e](https://github.com/AIssoufi/issoufi.fr/commit/da18f8ea46a30bff89521fa94ed5cd9ee8f8062d))
* keep the language toggle usable over the open mobile menu ([4dbd00d](https://github.com/AIssoufi/issoufi.fr/commit/4dbd00ddc32c9f30413fc5da6acf96c874bdfc8e))
* keep the page still behind the open mobile menu ([3ef0c9e](https://github.com/AIssoufi/issoufi.fr/commit/3ef0c9e87cff15c0b90d7f076b9bdd96cdc04a33))
* keep the words of the home title still while the pointer aims at a button ([b97193c](https://github.com/AIssoufi/issoufi.fr/commit/b97193cbdadbaa82cd59ed1f713d161f92fbcd1d))
* make the header compact on short screens ([2c93108](https://github.com/AIssoufi/issoufi.fr/commit/2c93108d10ac7f8bd4e4a59c72a2bf4bb51773d7))
* make the mobile menu fit phones held sideways ([8e73ef7](https://github.com/AIssoufi/issoufi.fr/commit/8e73ef7d05863abd1c8962970427943f0a2440ec))
* make the text readable: WCAG AA contrast, a 12 px floor and shorter lines ([23a45fa](https://github.com/AIssoufi/issoufi.fr/commit/23a45fa970fa462f9949d9b0b9d3fc8d4ebef779))
* make the texts and the like heart readable, also in forced colors mode ([ffaffa3](https://github.com/AIssoufi/issoufi.fr/commit/ffaffa3c18bd670eb4b590db158715ef054c3242))
* push no word of the home title while the mouse is over a link or a button ([9de86ed](https://github.com/AIssoufi/issoufi.fr/commit/9de86ed5d9766ddfdf048dd1f16c30f6a9ea4789))
* serve sharp company logos at twice their size ([77bdee6](https://github.com/AIssoufi/issoufi.fr/commit/77bdee6369395146872c1828af3e8163b7542171))
* serve sharp project thumbnails sized for each screen ([e02136a](https://github.com/AIssoufi/issoufi.fr/commit/e02136a6d18a5e3e1d68b26668f90d9e471e9591))
* serve sharp, right-sized project thumbnails and logos ([72b4ae4](https://github.com/AIssoufi/issoufi.fr/commit/72b4ae4e6a490407267732b9b651067a0c983ab3))
* show the experience cards in two columns on wide screens, with short lines ([5f72089](https://github.com/AIssoufi/issoufi.fr/commit/5f72089ebd5c4df17269723b5628c1248ac84979))
* show the visitor's own like on the project cards, without fake counts ([a82394d](https://github.com/AIssoufi/issoufi.fr/commit/a82394d05230e279a72d6c350411142a87c80a26))
* start the transitions at once with reduced motion ([5c67b40](https://github.com/AIssoufi/issoufi.fr/commit/5c67b40fdad768ce03b7dee26f2c02051d6cec11))
* translate the project names and types on the English site ([46f833e](https://github.com/AIssoufi/issoufi.fr/commit/46f833e4cbaef8d4d3cbc213c4525218750403ab))


### Performance

* cache the hashed assets for a year on Cloudflare Pages ([1b68588](https://github.com/AIssoufi/issoufi.fr/commit/1b68588776914e41c1905170cfda4e0d1a89bea6))
* load the first project thumbnail first and the others as they near the screen ([fad0f3f](https://github.com/AIssoufi/issoufi.fr/commit/fad0f3fff0545e167f6728279938eeb3a59dfd38))
* preload the background photo from the app, over a placeholder ([2712ad5](https://github.com/AIssoufi/issoufi.fr/commit/2712ad5d512a5145ad7a0104db6171e9e263d014))
* preload the background photo of each page, lighter on phones ([6f139a0](https://github.com/AIssoufi/issoufi.fr/commit/6f139a0e59c2dcb82fd5dc34791a1b9c7c2e873e))


### Code Refactoring

* apply the conventions review of the background photo preload ([4234f17](https://github.com/AIssoufi/issoufi.fr/commit/4234f177f2bb36f6da8d66f34cdbe6438fbb9e85))
* apply the findings of the conventions review ([5ac47f2](https://github.com/AIssoufi/issoufi.fr/commit/5ac47f2d7d4a18635c63233bbd76edebc95c3f76))
* apply the suggestions of the conventions review ([9789f74](https://github.com/AIssoufi/issoufi.fr/commit/9789f74c989f29e2807cb2d55a2df18d4e3446ab))
* **ci:** call the file check of compareFile a check ([aa9a72d](https://github.com/AIssoufi/issoufi.fr/commit/aa9a72d725ace0bf905a5b5fc397e17e0d81d272))
* **ci:** name the file checks of the smoke test checks ([3915548](https://github.com/AIssoufi/issoufi.fr/commit/391554805b3602396e2822b0c2596f494788c293))
* **cv:** name the font format and the font files that give a rule ([42533ae](https://github.com/AIssoufi/issoufi.fr/commit/42533aeb14afb5d96ada0a479397f52cfd29ba82))
* **cv:** print the CV offline with font files of the repository ([c6095be](https://github.com/AIssoufi/issoufi.fr/commit/c6095bec5627849d2866a1afaf5f2b3b89a2a147))
* document each format constant of pnpm icons ([346eb14](https://github.com/AIssoufi/issoufi.fr/commit/346eb144723635dd565a7ae3fc976ac64dca1611))
* **experiences:** name the fallback look of the periods and rewrap the JSDoc ([c796d73](https://github.com/AIssoufi/issoufi.fr/commit/c796d737416675749212ebb0cfda2723c4449da7))
* **experiences:** nest RoleDescription under CompanyEntry ([8e29949](https://github.com/AIssoufi/issoufi.fr/commit/8e2994988bac9e74d80a3b0921ca513e7ae817ca))
* **experiences:** read the period of a single role from its own dates ([a8bc3d4](https://github.com/AIssoufi/issoufi.fr/commit/a8bc3d45e461baa65b4aac2bb1bcf91c4f6564b2))
* **experiences:** render the timeline from a data file ([e5f38e7](https://github.com/AIssoufi/issoufi.fr/commit/e5f38e730b44230e2e6e4c77c456858daaa54e40))
* **experiences:** test the predicates of VisuallyHidden and Period on their own ([0a84146](https://github.com/AIssoufi/issoufi.fr/commit/0a841464478f7440a3655cab0d308106b9f8f08a))
* give each project an id of its own across both sections ([29adfe0](https://github.com/AIssoufi/issoufi.fr/commit/29adfe02bab8c821c292892dcd30684897e49c89))
* give the media type parser of the smoke test its own module ([41f2a3f](https://github.com/AIssoufi/issoufi.fr/commit/41f2a3ff8d2ad295a3490595919ba592bb2207ba))
* **i18n:** remove the exp texts that nothing reads ([d4b7dca](https://github.com/AIssoufi/issoufi.fr/commit/d4b7dca0119f5c2178a679bf43c6ee9b0ee7bf4e))
* **i18n:** translate the keys of JSON data with one helper ([ed45c81](https://github.com/AIssoufi/issoufi.fr/commit/ed45c81fda886c4cc0de50531f485bbc9adfab89))
* list the translations of a page in one helper ([29b8006](https://github.com/AIssoufi/issoufi.fr/commit/29b80062f607ff3772b319e6016821a432aba5ff))
* move CvLink into NavMenu, its only user ([a1989cf](https://github.com/AIssoufi/issoufi.fr/commit/a1989cf4c81203b247b76698b392e02df9c296d9))
* name the conditions of the annotation and redirect helpers ([ac8de94](https://github.com/AIssoufi/issoufi.fr/commit/ac8de94f86cbb63c28416ff506e8cee0fa47dbaa))
* read the LinkedIn profile of the CV from the site ([f19b4f3](https://github.com/AIssoufi/issoufi.fr/commit/f19b4f35371525647574fed6f750cf9998998540))
* release the page locks in any order and share the scroll test helpers ([42eb7e0](https://github.com/AIssoufi/issoufi.fr/commit/42eb7e0c81bc9282437896df285baad89f9fe572))
* render the status pages through a shared StatusPage ([6bdb935](https://github.com/AIssoufi/issoufi.fr/commit/6bdb9359ec7c5b26395e2f658f8d376be93634e0))
* return a plain boolean from isPublicFile ([e55915b](https://github.com/AIssoufi/issoufi.fr/commit/e55915b27d5adeaf5f167cd3c55bb248ed66b158))
* **scripts:** share the helpers of the og-image script ([0277e63](https://github.com/AIssoufi/issoufi.fr/commit/0277e631179d72e88a990d56f4771ff92a1885c1))
* share one reader of the files of public/ between the tests ([e8f4673](https://github.com/AIssoufi/issoufi.fr/commit/e8f46732694334eb8c22d37ee06054ed68a1c283))
* share the e2e helper that waits for the animations that end ([e7f9220](https://github.com/AIssoufi/issoufi.fr/commit/e7f922063cef94c49266ba6f18adf502cb6aa72b))
* share the run id check of the workflow run helpers ([2cbccc1](https://github.com/AIssoufi/issoufi.fr/commit/2cbccc1a7e470dcf61432e1b577ac8c00c9e531a))
* share the top space of the pages with the status pages ([5268883](https://github.com/AIssoufi/issoufi.fr/commit/5268883973aa4cf60634d3b6a33edca0e5f8ae27))
* share useMediaQuery and its matchMedia stub across the app ([2c6ae8a](https://github.com/AIssoufi/issoufi.fr/commit/2c6ae8af7e5b3dc011636546333c11536dbab1d5))
* split the WOFF2 reader of pnpm icons by topic ([65b1ff2](https://github.com/AIssoufi/issoufi.fr/commit/65b1ff21895101ac639bff15c78a6c59c993365b))
* write the duration of the like animation once ([cd6987b](https://github.com/AIssoufi/issoufi.fr/commit/cd6987be6a2eec0c092cf2b0e5bd01f3f2ef1ade))


### Documentation

* describe the browser checks of the project rows ([1002081](https://github.com/AIssoufi/issoufi.fr/commit/1002081571b9b81d13990136689a7fbebdf4730f))
* describe the contrast, the 12 px floor, the job cards and their browser tests ([2cd4ac2](https://github.com/AIssoufi/issoufi.fr/commit/2cd4ac2d89ae1b595f6939bfdb5c6e69a60d9482))
* describe the CV script and the data of the Experiences page ([c3d96ce](https://github.com/AIssoufi/issoufi.fr/commit/c3d96ce4f6df6c35dde398bd2bfd18ad4debcb8a))
* describe the CV tooltip and its browser test ([ee90bc4](https://github.com/AIssoufi/issoufi.fr/commit/ee90bc4da51df5c29fa899bd972ff1f00d4c4583))
* describe the floating CV button and its browser tests ([6eabe44](https://github.com/AIssoufi/issoufi.fr/commit/6eabe447fe9eb861e90ac08f9b3da9657a1d250b))
* describe the fluid hero tokens and its browser test ([ebe0030](https://github.com/AIssoufi/issoufi.fr/commit/ebe00303391d59602084e9d5f5bd6ec51eb2cca6))
* describe the headings, the periods and the browser test of the Experiences page ([bf70a8c](https://github.com/AIssoufi/issoufi.fr/commit/bf70a8c72f425f597e5660b7e89efaaeec7988b1))
* describe the links of the header bar and drop the tooltip and the patch ([260d774](https://github.com/AIssoufi/issoufi.fr/commit/260d77410bacfd98430fc50da4a8d1fc10a255b1))
* describe the self-hosted fonts and the browser test of the Google requests ([3ece408](https://github.com/AIssoufi/issoufi.fr/commit/3ece4089bd3b900656baf2a31898ad07a52b425d))
* describe the translation keys of the project data ([f1459e9](https://github.com/AIssoufi/issoufi.fr/commit/f1459e94431ff0d5566832af790ce80eb052dad0))
* document the project thumbnails, the company logos and their browser test ([d8519c8](https://github.com/AIssoufi/issoufi.fr/commit/d8519c8a4e2ea87781d45b3f506d0b6c05312655))
* explain how to regenerate or remove a dependency patch ([7621718](https://github.com/AIssoufi/issoufi.fr/commit/7621718528e7a617fbf50e71e1b3955102054f9a))
* list the browser test shards among the jobs that install the dependencies ([3cf6e5c](https://github.com/AIssoufi/issoufi.fr/commit/3cf6e5cf051f849425419b0f09346fbd84c7b651))
* match the comments of the navigation and the CV link to their behavior ([45bb6fb](https://github.com/AIssoufi/issoufi.fr/commit/45bb6fb3c7a88ce00259415c6917a7192d94f892))
* name the background photo placeholders that img-src data: allows ([14f68ae](https://github.com/AIssoufi/issoufi.fr/commit/14f68ae7587b5bc81b81f0de8469a35511f74177))
* name the test timeout in CLAUDE.md ([64cd10c](https://github.com/AIssoufi/issoufi.fr/commit/64cd10c8b507fa5a922d2a95d8cfe8c981c40407))
* rewrap the JSDoc of the not found page helpers and pin the cut of a long path ([40ec986](https://github.com/AIssoufi/issoufi.fr/commit/40ec986739793c3d502d9e0fde48fcdbe9fd2544))
* say that the status pages share the photo of the home page ([f0149c8](https://github.com/AIssoufi/issoufi.fr/commit/f0149c8a2786be292f374b2fecc337f42d7debdd))
* say what SITE_URL of the CI scripts is the source of truth for ([083e054](https://github.com/AIssoufi/issoufi.fr/commit/083e05467c3a7cadec3de872abb6b619937f1aab))

## [1.1.0](https://github.com/AIssoufi/issoufi.fr/compare/v1.0.0...v1.1.0) (2026-10-18)


### Features

* add the Open Graph image of link previews ([c3ea6a0](https://github.com/AIssoufi/issoufi.fr/commit/c3ea6a000e3f480bd8a882845c1da551805b5703))
* **app:** show a recoverable error instead of a blank page ([d8c479c](https://github.com/AIssoufi/issoufi.fr/commit/d8c479c622f27dea68b848d39fa799593e7dc08c))
* **header:** keep the focus in the open mobile menu and close it with Escape ([01c2bef](https://github.com/AIssoufi/issoufi.fr/commit/01c2bef4152221ea7f3afaab382b4d4b69c90da1))
* **i18n:** serve the English pages at their own /en/ URLs ([a1d1d07](https://github.com/AIssoufi/issoufi.fr/commit/a1d1d079d994055d6e79779baa601c412e770e41))
* keep the chosen language after a reload ([01caa4f](https://github.com/AIssoufi/issoufi.fr/commit/01caa4f814c42ec8be842ad283888e6e328f0057))
* make the contact links of the CV clickable ([bb5647b](https://github.com/AIssoufi/issoufi.fr/commit/bb5647b438c54a70527aeeb7689516f6afc9e3ee))
* show a GitHub link and the deployed version in the bottom left corner ([33c1969](https://github.com/AIssoufi/issoufi.fr/commit/33c1969e0891814a7cdd4ecc2bd470cfaf494942))
* show the build version after the logo and a GitHub icon under the language toggle ([efc9e46](https://github.com/AIssoufi/issoufi.fr/commit/efc9e46c5d54d9d97c136a9f93b4de6136af8927))
* show the build version after the logo and the GitHub icon under the language toggle ([3a846c4](https://github.com/AIssoufi/issoufi.fr/commit/3a846c4e4d2aad24615a51471e6d41112d7d2924))
* show the version under the logo and the GitHub icon under the navigation ([f9b7a56](https://github.com/AIssoufi/issoufi.fr/commit/f9b7a567e35900f28d2de774332b4d9b451ab307))


### Bug Fixes

* **a11y:** give each page a single main landmark and a single h1 ([2a6ba78](https://github.com/AIssoufi/issoufi.fr/commit/2a6ba7848d59c33cbf1583118d5f6cb1d7a0e2cd))
* **a11y:** give the projects page a single h1 ([cee9687](https://github.com/AIssoufi/issoufi.fr/commit/cee968738f214133b68a9523e60353a75ef2cd8f))
* **a11y:** keep a single main landmark per page ([959c60c](https://github.com/AIssoufi/issoufi.fr/commit/959c60cd478f6f62f5714ee132de1a70872c4851))
* **a11y:** keep the list semantics of unstyled lists in Safari ([ffbc46a](https://github.com/AIssoufi/issoufi.fr/commit/ffbc46a2d485eb2bdc1473292560539ee2cc4689))
* **app:** keep the header on screen while the page reloads for a missing chunk ([9881f2a](https://github.com/AIssoufi/issoufi.fr/commit/9881f2a4d9697fcc398eb736067fbea5e8823552))
* **burger-menu:** make the burger a button for the keyboard and screen readers ([84189b4](https://github.com/AIssoufi/issoufi.fr/commit/84189b45a789046a73036811b15b3682626887c1))
* close the mobile menu on the desktop layout and move the focus after a navigation ([3978e71](https://github.com/AIssoufi/issoufi.fr/commit/3978e71ec9ad164a632f000cbf1ebb8d1b38135d))
* correct the French text of the projects data ([55449b2](https://github.com/AIssoufi/issoufi.fr/commit/55449b2c7f92a8e3e682e628ca639c290b862246))
* correct the spelling and typography of the French copy ([e30b188](https://github.com/AIssoufi/issoufi.fr/commit/e30b18837dae3037f2c44c6e0cf345ea817896df))
* correct the spelling mistakes of the French copy ([f1cd02a](https://github.com/AIssoufi/issoufi.fr/commit/f1cd02a434bf83e09b24fd22f5bef6b52d14e59d))
* **experiences:** center the timeline dots on the line ([0188e9e](https://github.com/AIssoufi/issoufi.fr/commit/0188e9e60d5eee75a178e623a42e5e475f4231a1))
* **experiences:** center the timeline dots on the line on mobile ([edf823a](https://github.com/AIssoufi/issoufi.fr/commit/edf823aa5b7aba96e5eeebb8695e3a0e0808a7df))
* **experiences:** remove the arrow that looked like a project toggle ([1518eb4](https://github.com/AIssoufi/issoufi.fr/commit/1518eb4f019a9d4df4095cab89cc963f8efb0b37))
* expose the active language of the toggle to screen readers ([732671b](https://github.com/AIssoufi/issoufi.fr/commit/732671b03bc80bd621c14e9fa856f5eff4fd669a))
* fit the home buttons to narrow screens ([88451d2](https://github.com/AIssoufi/issoufi.fr/commit/88451d2e59d1fba9fb965623dcd51ae3cab4032c))
* **header:** close the mobile menu when the screen grows to the desktop layout ([522490d](https://github.com/AIssoufi/issoufi.fr/commit/522490d4238988741a1213080cbe3b75ae74cc8d))
* **header:** link the burger to the menu and let Tab reach its links ([66c7454](https://github.com/AIssoufi/issoufi.fr/commit/66c7454fd370e1e91c06ca5b93f0d7c7dac1f972))
* **header:** make the burger menu usable with a keyboard and a screen reader ([abeed1f](https://github.com/AIssoufi/issoufi.fr/commit/abeed1fb60e86417b85e28b08265ea088187ce05))
* **home:** invert the colors of the secondary button on hover ([483480c](https://github.com/AIssoufi/issoufi.fr/commit/483480c7a6f54fec188ae831e60449dd8dcf93f9))
* **i18n:** show the message for browsers without JavaScript in the language of the page ([93fdedd](https://github.com/AIssoufi/issoufi.fr/commit/93fdedd728b67275724c1386d924584c6feefb1b))
* keep French colons and semicolons on the line of their word ([282c549](https://github.com/AIssoufi/issoufi.fr/commit/282c5491c0314e48d722ad7eb6256feafd62c267))
* keep the content of the pages out from under the floating controls ([1aa6d94](https://github.com/AIssoufi/issoufi.fr/commit/1aa6d946a51f4c2de43203d18c916bd31995fd7e))
* keep the language toggle from covering the content on mobile ([1fd2ff1](https://github.com/AIssoufi/issoufi.fr/commit/1fd2ff149e0e9815c23bfb9438c960490f66fe98))
* move the keyboard focus to the new page after a navigation ([6c4c009](https://github.com/AIssoufi/issoufi.fr/commit/6c4c009aa5c7f3048c998015b9e8abedc03ce29f))
* **projects:** apply the row gap and the columns of the "show all" grid ([269e744](https://github.com/AIssoufi/issoufi.fr/commit/269e7441960ca0512eada090734d96181f365523))
* **projects:** fix the layout of the project grid ([5986911](https://github.com/AIssoufi/issoufi.fr/commit/5986911ff685a547f87482853ce7699ef7d0f142))
* **projects:** give the project section controls an accessible name ([cf8fa31](https://github.com/AIssoufi/issoufi.fr/commit/cf8fa31fb51e9b622b79a51d6df24d88ce191a12))
* **projects:** group the section controls under the section title ([152c1c4](https://github.com/AIssoufi/issoufi.fr/commit/152c1c439f60ee4e10cfcc41a94541c6f3ca2482))
* **projects:** keep the size of the cards of the row when showing all ([8ceba84](https://github.com/AIssoufi/issoufi.fr/commit/8ceba84ffee812d1ead9b7634d2a8c5ab9d4e006))
* **projects:** keep the size of the project cards when showing all ([4c8f7b9](https://github.com/AIssoufi/issoufi.fr/commit/4c8f7b97a25010cab8bd8cfc57babcef0f8b0e23))
* **projects:** line up the show-all cards with the section title on mobile ([b251a74](https://github.com/AIssoufi/issoufi.fr/commit/b251a74d382f27b29a4db5ccdeefd3392e168e99))
* **projects:** name the like buttons after their project ([2e6e19c](https://github.com/AIssoufi/issoufi.fr/commit/2e6e19c7f75f1ddec95724978a12d25fb07d876d))
* **projects:** name the pager buttons for screen readers ([5b36f6a](https://github.com/AIssoufi/issoufi.fr/commit/5b36f6ac79cf387ebfbb4c5ec221ef102ec86d5a))
* **projects:** shrink the like button while it is pressed ([2926dee](https://github.com/AIssoufi/issoufi.fr/commit/2926deedf7ccc3a8acbb22c3b501aded36aa553f))
* **projects:** start a short last page of the row on the left ([7421c8e](https://github.com/AIssoufi/issoufi.fr/commit/7421c8e2c7f49df13e9ad8a53ba604d90e149b33))
* **projects:** take the like button out of the project card link ([1e22c23](https://github.com/AIssoufi/issoufi.fr/commit/1e22c2398981343b59e6090191c0a271b0c76527))
* **projects:** wrap the tech line of a project card instead of overflowing ([1c00628](https://github.com/AIssoufi/issoufi.fr/commit/1c006287953d7583e57ebc31ef5de53c2312b614))
* **projects:** write the client name Trouillet Décors with its accent ([fe301c1](https://github.com/AIssoufi/issoufi.fr/commit/fe301c140fc03c87be8aba177d3d1d5fcb79097d))
* show experience durations in the active language ([8ecf50f](https://github.com/AIssoufi/issoufi.fr/commit/8ecf50f63bb69b5030a5df72425aef9d52129d57))
* spell the Weezevent brand right in the English copy ([8745b6a](https://github.com/AIssoufi/issoufi.fr/commit/8745b6a44c0c5d162580d735cb5abf8d1edd32a3))
* stop the home page from scrolling sideways on mobile ([6da77ed](https://github.com/AIssoufi/issoufi.fr/commit/6da77edbafedfe3416534b1b5f4049245543b430))
* stop wide content from making narrow screens scroll sideways ([dae40c6](https://github.com/AIssoufi/issoufi.fr/commit/dae40c64a13ca760a699fabdf801c2970982ab5d))
* use typographic apostrophes in the French copy ([29c3c11](https://github.com/AIssoufi/issoufi.fr/commit/29c3c11ad42da190fd46811d89ca3cee92126b99))


### Performance

* generate the link preview image with pnpm og-image, as a 101 kB JPEG ([d4d28bc](https://github.com/AIssoufi/issoufi.fr/commit/d4d28bcd4ded4ee58dcc139950041ea67d939ffe))
* load the light build of lottie-web after the first render ([8977dbf](https://github.com/AIssoufi/issoufi.fr/commit/8977dbf2ab556bbb97ece9d76bc6e39bce5e55b9))
* load the pages other than home on their first visit ([3ccc273](https://github.com/AIssoufi/issoufi.fr/commit/3ccc273798cc26bcd028ed0bd4d4848a30f4c2da))
* preload the chunk of each page in its generated HTML ([f51bed9](https://github.com/AIssoufi/issoufi.fr/commit/f51bed90800e3cc506ef27c8e14caa207ec52bbe))
* serve the page backgrounds as WebP ([5907726](https://github.com/AIssoufi/issoufi.fr/commit/59077263bd56a9dd9ac09ddedf3389ef08efecfd))
* serve the project screenshots as WebP ([9c9814c](https://github.com/AIssoufi/issoufi.fr/commit/9c9814ced2d125c4b06d59ddac9c9300db812b90))
* shrink the CV PDF from 3.85 MB to 275 kB ([656dac3](https://github.com/AIssoufi/issoufi.fr/commit/656dac3b359819577a45bba6de65f1d864e9fce5))
* split the JavaScript bundle per route ([ac157ab](https://github.com/AIssoufi/issoufi.fr/commit/ac157ab31bdc8df976d2b0f1cf1062f0c1466e1a))


### Code Refactoring

* add a JobSummary component to the Experiences page ([f0d24ea](https://github.com/AIssoufi/issoufi.fr/commit/f0d24ea11abecbbc87968315f92c5b6e08869c91))
* align the site badge code and comments with the conventions ([9e3cc0e](https://github.com/AIssoufi/issoufi.fr/commit/9e3cc0e350a7d570e6b12a58be208c5a16720fc3))
* **app:** drop the undocumented defaults of the error boundary ([fb9af75](https://github.com/AIssoufi/issoufi.fr/commit/fb9af75ab7e13edce4184844a708f8c6008aa42e))
* apply the suggestions of the conventions review ([eb6af15](https://github.com/AIssoufi/issoufi.fr/commit/eb6af1501f081fe514b4f761c6431ef410918704))
* **build:** move the HTML rendering of the pages to src/utils/pageHtml.ts ([56ff070](https://github.com/AIssoufi/issoufi.fr/commit/56ff070902caba0274e3f1cad3ccf4d3b4bf220c))
* **build:** share the home page of PAGES as HOME_PAGE ([fa83ed8](https://github.com/AIssoufi/issoufi.fr/commit/fa83ed8d8db0d595053399e4fd0cdaf78dae12bb))
* **burger-menu:** render again once the icon animation is drawn ([6bdb7c9](https://github.com/AIssoufi/issoufi.fr/commit/6bdb7c9f0f891af0debbca26b11acc22dbf859c5))
* **ci:** apply the coding conventions to the CI scripts, config and docs ([e3bb2b5](https://github.com/AIssoufi/issoufi.fr/commit/e3bb2b54d467e2a6f4d0435f4b3ef3f30e78cfdc))
* **ci:** move the bundle report rendering to its own module ([3cf04ac](https://github.com/AIssoufi/issoufi.fr/commit/3cf04acb70d80380d04149c07e874cecc13bddd2))
* **ci:** name and test the files counted in the script budget ([b19ff25](https://github.com/AIssoufi/issoufi.fr/commit/b19ff25ca416eb182c9ebfcdbac36360ec0efc61))
* **ci:** name the check of the HTML pages of the build ([65a1541](https://github.com/AIssoufi/issoufi.fr/commit/65a15412a60befefc093eb069f92e08883e33602))
* **ci:** name the patterns that read the head of a page ([8830c99](https://github.com/AIssoufi/issoufi.fr/commit/8830c990f1782285a66f59a278124c063f232721))
* **ci:** share the budget checks and read the home page in its own module ([5eeda50](https://github.com/AIssoufi/issoufi.fr/commit/5eeda50436e3a894c0ecd0962507643e63ca0590))
* **ci:** share the check of the budget and size limits ([915f8b4](https://github.com/AIssoufi/issoufi.fr/commit/915f8b4b6d7562ae7db2fc9c8e0d00baa2ecc8e8))
* **ci:** split the bundle report into its scripts and images sections ([64c43fe](https://github.com/AIssoufi/issoufi.fr/commit/64c43feab69d6caa71970033c7d4e2b314b357c9))
* **ci:** split the CI helpers by topic ([d722cb9](https://github.com/AIssoufi/issoufi.fr/commit/d722cb9d731056de9328725e74cb9ce8890d9d0b))
* **ci:** split the paths of the build in a tested helper of the smoke test ([1a9cefe](https://github.com/AIssoufi/issoufi.fr/commit/1a9cefeddb566da59a26ce8e83cfbcc50de09d47))
* **components:** read the width of the status message from the theme ([cd0034a](https://github.com/AIssoufi/issoufi.fr/commit/cd0034ac0e5915e599a78d5e5346b3ff10b9ff3e))
* describe the timeline dot as marking any entry ([28b3155](https://github.com/AIssoufi/issoufi.fr/commit/28b31550295b7ac0ea3d8882fa8db25a7579b5f2))
* **experiences:** drop the unused color transition of project titles ([ceee982](https://github.com/AIssoufi/issoufi.fr/commit/ceee98211a9b935618b0c923a642423da384a2ae))
* **experiences:** leave out an empty project header ([3b9f372](https://github.com/AIssoufi/issoufi.fr/commit/3b9f37261c553f38c0b933d2a47a1b65575e78eb))
* **experiences:** read the raw sizes from the theme, drop redundant list styles ([a3258fd](https://github.com/AIssoufi/issoufi.fr/commit/a3258fdf416bfecc0919e9c6be48280da87f11d4))
* **experiences:** share the position of the timeline line with its dots ([fe04b3f](https://github.com/AIssoufi/issoufi.fr/commit/fe04b3fff98ecc719e2cfe526909cc238a76e873))
* extract a shared JobSummary component on the Experiences page ([a665ecc](https://github.com/AIssoufi/issoufi.fr/commit/a665eccea0b8bd1d31a9459bc97be98a60106f80))
* give the preview server an explicit default port ([1398fd3](https://github.com/AIssoufi/issoufi.fr/commit/1398fd3581ba0abdc12a3f14af1e247cca13bc12))
* **header:** give the burger button element to a ref ([8c43c7c](https://github.com/AIssoufi/issoufi.fr/commit/8c43c7ceb3e46275f693625f598aad3af37df03f))
* **header:** read the raw sizes and timings from the theme ([7075cb9](https://github.com/AIssoufi/issoufi.fr/commit/7075cb9db51be7ab384d3db327fef50eb7e4a151))
* **home:** read the raw sizes from the theme ([2bed25c](https://github.com/AIssoufi/issoufi.fr/commit/2bed25c7464653355cff40a287324af7d6ac3982))
* **i18n:** share the translation entries helper of the French tests ([07f93f6](https://github.com/AIssoufi/issoufi.fr/commit/07f93f6c781d88f68b4aee95470ef232fd029aa3))
* **i18n:** type the English translations from the French keys ([4025b1b](https://github.com/AIssoufi/issoufi.fr/commit/4025b1bc00cc315ba8bcce5f57e396bc0b33350a))
* import the router from react-router instead of react-router-dom ([f802305](https://github.com/AIssoufi/issoufi.fr/commit/f80230517822fd041cb0a6a90fa332071f552397))
* keep the language toggle constants together ([69d5982](https://github.com/AIssoufi/issoufi.fr/commit/69d598219da7172570a29e62e016b5542033a1ba))
* keep the logo alt text of JobSummary empty for a null company name ([592aad9](https://github.com/AIssoufi/issoufi.fr/commit/592aad9d72bcbd3cc1bb3a78550e496922988837))
* move the experience duration helpers to utils ([1c3b3b8](https://github.com/AIssoufi/issoufi.fr/commit/1c3b3b86d585cc3b8abf39ccb058966a4413e86b))
* move the language toggle into the header ([aed4077](https://github.com/AIssoufi/issoufi.fr/commit/aed4077d8249baad49e7486d8c358c9548acfe82))
* move the page backgrounds to the constants files ([7f38c6f](https://github.com/AIssoufi/issoufi.fr/commit/7f38c6f0e84b989d1e596c62b5ea0c624553fd0b))
* move the site languages to the i18n module ([c9692c4](https://github.com/AIssoufi/issoufi.fr/commit/c9692c4738a61d385ddabcce8794116540572201))
* move the StrongWord styles to SplitWords ([941201e](https://github.com/AIssoufi/issoufi.fr/commit/941201e78eb6f98243b8f6085e866cfde563d48c))
* name the folder check of listFileNames ([b02120e](https://github.com/AIssoufi/issoufi.fr/commit/b02120e2eb57060d5acab8ce8b8b4c4e1b321a49))
* name the playback speeds and directions of the burger icon ([a7bf223](https://github.com/AIssoufi/issoufi.fr/commit/a7bf223466a1186a4f5a98ad5bff808f856f3c88))
* pass the clipping helper of the floating controls test an object ([da386c0](https://github.com/AIssoufi/issoufi.fr/commit/da386c0ba810bba831f29bd9542400fe52ad58a4))
* **projects:** link a project card only when it has a name ([3d00c45](https://github.com/AIssoufi/issoufi.fr/commit/3d00c45168c26e833f7a2c55f7e1194faaeffda2))
* **projects:** make "Show all" a plain button ([535ecc9](https://github.com/AIssoufi/issoufi.fr/commit/535ecc909e704ac7a3fc713852a79e35133b6f76))
* **projects:** read the raw sizes and timings from the theme ([c26a5fa](https://github.com/AIssoufi/issoufi.fr/commit/c26a5fabfa8af0f0e17a64c26fe89f32a4c5f666))
* **projects:** render no empty section heading without a title ([204d85a](https://github.com/AIssoufi/issoufi.fr/commit/204d85ad23c2af60278e21ca399be4e0398c142b))
* put the unit in the name of the coverage thresholds ([00c4062](https://github.com/AIssoufi/issoufi.fr/commit/00c40620c0ab7fb01c571df5cc6ad5d40b2639e1))
* read the timeline offsets of the Experiences page from the spacing tokens ([15366bf](https://github.com/AIssoufi/issoufi.fr/commit/15366bf2fb04725c766dda3e61e40f62a2b5fcbf))
* read the width of the app container from the sizes tokens ([ca93b5d](https://github.com/AIssoufi/issoufi.fr/commit/ca93b5d93e9fce2a9a6ebd8814ba19c906a1816d))
* refuse a role on List in TypeScript ([24f411f](https://github.com/AIssoufi/issoufi.fr/commit/24f411fd5165bc99c2e5debf076490103d403a00))
* remove the unused Modal component ([9001b6e](https://github.com/AIssoufi/issoufi.fr/commit/9001b6ee95c72c4a25628939e5a477c1a3adcf57))
* remove the unused RoleHeader styled component ([e88ab93](https://github.com/AIssoufi/issoufi.fr/commit/e88ab93b9683326385e3d414838fd8c7fdac4557))
* render the job summaries of the Experiences page with JobSummary ([83eaaa3](https://github.com/AIssoufi/issoufi.fr/commit/83eaaa3c0ccc569d18bcf818d01c9850db0e4cb3))
* share the card and timeline styles of the Experiences page ([d8c9c6d](https://github.com/AIssoufi/issoufi.fr/commit/d8c9c6d1890ea150a15b8415e5faca1f0753919b))
* share the frosted pill and button size of the language toggle ([01dd7d2](https://github.com/AIssoufi/issoufi.fr/commit/01dd7d225ea536996c53a0589270fd58a91a375c))
* share the Page layout from src/components ([500b788](https://github.com/AIssoufi/issoufi.fr/commit/500b788966f282d277390ea076a8d67381fd09f5))
* share the public file check of the page tests ([9bd2c8e](https://github.com/AIssoufi/issoufi.fr/commit/9bd2c8e69a3ca9e177d15d93b7be4dd7153924a6))
* split the standalone build helpers by topic ([b342c4b](https://github.com/AIssoufi/issoufi.fr/commit/b342c4b63405f510b76abf7cb28835244ab7c4ce))
* **status-message:** add an optional action button ([f57fd3a](https://github.com/AIssoufi/issoufi.fr/commit/f57fd3a4f795e72119a15da91d9f6538717a5b72))
* stop components from importing the styles of another component ([3478b08](https://github.com/AIssoufi/issoufi.fr/commit/3478b08c8e290b9f4378286e52f396aa785d75d2))
* take the description of the link preview image from the translations ([68525af](https://github.com/AIssoufi/issoufi.fr/commit/68525afec712e9ebf6ee133d59053d1b7d006beb))
* **test:** share the CSSOM test helpers from src/styleTestUtils.js ([46da8cd](https://github.com/AIssoufi/issoufi.fr/commit/46da8cd043657aaa754ca918c1bcea46a1b9c753))
* **theme:** add a primitive size scale ([615d058](https://github.com/AIssoufi/issoufi.fr/commit/615d0580f54943994cff9f1b41a92b69b7a92ccf))
* **theme:** back every semantic token with a primitive ([bf25d38](https://github.com/AIssoufi/issoufi.fr/commit/bf25d383e4d201c0c6e6adafc81182d8b22b8bfb))
* **theme:** read every raw size, duration and easing of the style files from tokens ([fab3eb7](https://github.com/AIssoufi/issoufi.fr/commit/fab3eb754aabc0874a2f1366c3f5974c29cad277))
* **theme:** size every element with border-box ([c10a937](https://github.com/AIssoufi/issoufi.fr/commit/c10a9378e0f56baf1c005ea7d60145218075c614))
* treat a blank page folder as missing in the chunk lookup ([2c629e6](https://github.com/AIssoufi/issoufi.fr/commit/2c629e672ea248e4534c577cbd194784e7b7c846))


### Documentation

* bring the README and CLAUDE.md in line with the repository ([2d95720](https://github.com/AIssoufi/issoufi.fr/commit/2d95720eeffc4e3bd3229e78ad2eca3ff376952e))
* **ci:** say exactly which limits and lists the CI helpers accept ([b55fec2](https://github.com/AIssoufi/issoufi.fr/commit/b55fec2bb67f3a269d312c50d6f597daf5cde4b1))
* **ci:** type the parameters of the CI helpers with named typedefs ([e773b57](https://github.com/AIssoufi/issoufi.fr/commit/e773b573a93cb4f5a533ceb74f88c84aa6e9c83f))
* cross-reference the folders of the chunks and of the size budget ([b847d1d](https://github.com/AIssoufi/issoufi.fr/commit/b847d1d13dfff01e3bbd8f01403a229d66def42e))
* describe the deploy key and the rulesets of the daily deploy ([517f393](https://github.com/AIssoufi/issoufi.fr/commit/517f3938e63f52fa8cd5e3a46c72dfe688778254))
* describe the test setup that keeps the output clean ([b347516](https://github.com/AIssoufi/issoufi.fr/commit/b347516de626665dded0075f4f60f8ca0e268de0))
* document the helpers shared by the page tests ([9589cdc](https://github.com/AIssoufi/issoufi.fr/commit/9589cdc48160169b8086023398ba32c8f0f3aa41))
* drop the sizes of the standalone build from the README ([8de5d5b](https://github.com/AIssoufi/issoufi.fr/commit/8de5d5b6edb177c36c4d9f14a7c8fe2bd6a1ecee))
* explain the sizes kept for content-box ([8d2b287](https://github.com/AIssoufi/issoufi.fr/commit/8d2b287485402c272da0ca6b6ee4a872cd829895))
* **home:** give the real reason for the non-breaking space of the title ([4b8b3a2](https://github.com/AIssoufi/issoufi.fr/commit/4b8b3a21f071dda6d3c96027e2813d76c8e6c209))
* list every failure of the timeline test and the rejection of its helper ([c6875f7](https://github.com/AIssoufi/issoufi.fr/commit/c6875f7f785d2942709c0ddf5c3ad18bce1c7889))
* list the CSS rule guard and the style test helpers in the README ([3383513](https://github.com/AIssoufi/issoufi.fr/commit/338351379786f13b0dfd9b035f7587095e2b1460))
* mention the language URLs in the summaries of the browser tests ([fe3b438](https://github.com/AIssoufi/issoufi.fr/commit/fe3b438e4f36ebdded9c336d9ccfca3b5bc0b5bc))
* name every folder that the type-check and the port helpers serve ([038b6be](https://github.com/AIssoufi/issoufi.fr/commit/038b6be87d89d5c9fc236389f86d5867409e8bf4))
* name the test helpers among the *.spec.js files ([fec6b9b](https://github.com/AIssoufi/issoufi.fr/commit/fec6b9b4106471f1981b7fd2a8ee6c8f71604fe1))
* name ticket branches after their reference and set up Worktrunk ([3513f60](https://github.com/AIssoufi/issoufi.fr/commit/3513f60074fa0294a35fd050a49e6e0b25380e54))
* name ticket branches after their ticket reference ([36e4908](https://github.com/AIssoufi/issoufi.fr/commit/36e4908d5bf7ff6a3223420817c7a237cbf54b33))
* **projects:** rewrap the JSDoc of the project section ([84d26b0](https://github.com/AIssoufi/issoufi.fr/commit/84d26b07a429ea7b25fc6e27c57f73f6a813bbab))
* **projects:** say that the section title also names its controls group ([55d8868](https://github.com/AIssoufi/issoufi.fr/commit/55d886819a275c01af8054d7c6da6e4ebed96d84))
* say that only the theme specs render the theme provider themselves ([1f8d633](https://github.com/AIssoufi/issoufi.fr/commit/1f8d63395fba6aedcb1c4966cf314e1b54a55d69))
* **standalone:** say that the standalone build opens in French ([81db353](https://github.com/AIssoufi/issoufi.fr/commit/81db3538fd9ddf6a0d22cfd983b1edf24c96fd8b))
* start the summaries of the test helpers with a verb ([849f011](https://github.com/AIssoufi/issoufi.fr/commit/849f011142e96be2e9f4d46fce8fe8a7b277bf2b))
* **theme:** say what findRawValues leaves unchecked ([d70252c](https://github.com/AIssoufi/issoufi.fr/commit/d70252ce9ba920f6bdcd9b3b910bae2ec3bb3865))

## [1.0.0](https://github.com/AIssoufi/issoufi.fr/compare/v0.1.0...v1.0.0) (2026-10-17)


### Features

* add chess game link to project card ([8580dfd](https://github.com/AIssoufi/issoufi.fr/commit/8580dfdb78a9f9a45b1eec81e5568e1eb9bdf7dc))
* add FR/EN language switcher with full i18n support ([ce3490f](https://github.com/AIssoufi/issoufi.fr/commit/ce3490fd9de458b776adb80d7c94080313eb1f42))
* add GitHub Pages deployment workflow ([ead267a](https://github.com/AIssoufi/issoufi.fr/commit/ead267a74aee5ff5e67f8983073375ce2e418889))
* add NotFound and Forbidden pages without redirects ([d2cfb11](https://github.com/AIssoufi/issoufi.fr/commit/d2cfb11332e64d7ea7b074d6a6713abd714110b5))
* add SEO and social metadata for issoufi.fr ([cf1a606](https://github.com/AIssoufi/issoufi.fr/commit/cf1a606294c9de5d93d18059fb85b96a0fcfa3de))
* add word-level mouse repulsion physics on bold title text ([dcc5ce4](https://github.com/AIssoufi/issoufi.fr/commit/dcc5ce4380613e696f6ccda61634646d9c630d1c))
* compute years of experience from career start date ([c6cd930](https://github.com/AIssoufi/issoufi.fr/commit/c6cd93043723112fbe9fb37135c5b0892180501a))
* error pages, component conventions and full test and JSDoc coverage ([10afee5](https://github.com/AIssoufi/issoufi.fr/commit/10afee58c35ecc5043a67b0785af8c78fcc3e10a))
* generate one HTML page per route with its own metadata ([d4808c7](https://github.com/AIssoufi/issoufi.fr/commit/d4808c71fc422d8959838ed191afbfef4ee527e0))
* migrate to Cloudflare Pages on issoufi.fr ([57fdcec](https://github.com/AIssoufi/issoufi.fr/commit/57fdceccaaf5608eadd4b5d1d1fe3e728f668f99))
* modernize project cards with 3D tilt, shimmer and interactive like ([11068c0](https://github.com/AIssoufi/issoufi.fr/commit/11068c05ce0d86813c1d8c117818776cc9c2e8c7))
* redirect the removed /skills page to the home page ([5010c81](https://github.com/AIssoufi/issoufi.fr/commit/5010c81d2adf2ef9315c6f584c6c1bd2fccc235a))
* remove skills page ([ac4e54a](https://github.com/AIssoufi/issoufi.fr/commit/ac4e54aaaacc830c723e495193a6d1f40cb44c23))
* render the not found page for unknown routes ([4ffb50b](https://github.com/AIssoufi/issoufi.fr/commit/4ffb50b2aaa213a0a8bd9accf0479238e2a07255))
* serve a real 404 status for unknown pages ([7cf685e](https://github.com/AIssoufi/issoufi.fr/commit/7cf685e1fd6fd47944d045fee8fd3ba2c1c1dd7a))
* stagger gradient animation and add particle field on home ([cbb7728](https://github.com/AIssoufi/issoufi.fr/commit/cbb7728427a5b1c640bc60779fe3a1d718c3ecbb))
* style components with xstyled design tokens ([712c8ad](https://github.com/AIssoufi/issoufi.fr/commit/712c8ad54923f4df0b7f4ac16426fce2b73a600f))
* sync document metadata with the active language ([69cdec2](https://github.com/AIssoufi/issoufi.fr/commit/69cdec23b27b3a80fad8a5e9f1fab9fecf9e2c28))


### Bug Fixes

* add vitest/globals types to tsconfig for typecheck compatibility ([21a168b](https://github.com/AIssoufi/issoufi.fr/commit/21a168b306019739a9a6628c4fad70c8fb5459fd))
* correct French nav translations ([c0d0647](https://github.com/AIssoufi/issoufi.fr/commit/c0d064792ba2423c26934af331078ee47c803a44))
* handle invalid experience dates instead of guessing ([f3541ce](https://github.com/AIssoufi/issoufi.fr/commit/f3541ce873e9cd8d642388161da88e325e4bf11d))
* play burger close animation when menu closed via nav item click ([50df665](https://github.com/AIssoufi/issoufi.fr/commit/50df665d120172a0854c6968e1ae188f62ee949c))
* redesign mobile menu as fullscreen glassmorphism overlay ([aa15b7a](https://github.com/AIssoufi/issoufi.fr/commit/aa15b7a9b7d50f41db6950ec64e85c5bb290d7b8))
* remove '(en cours)' suffix from UI/UX Design skill labels ([b65e499](https://github.com/AIssoufi/issoufi.fr/commit/b65e4995ecd331da6e0839289ba08efeac8cefe6))
* remove the apple-touch-icon link to a missing logo ([c5d7d20](https://github.com/AIssoufi/issoufi.fr/commit/c5d7d2023f06759a6616301f1a36990cb8f0a8f5))
* replace Create React App defaults in the web manifest ([ddf9cea](https://github.com/AIssoufi/issoufi.fr/commit/ddf9cea9a4c0eff8a26e66de5f9ac44dfe17e6c2))
* return 0 years instead of NaN for invalid dates ([a1afc23](https://github.com/AIssoufi/issoufi.fr/commit/a1afc23640bb8461b4055a02e30ec9b2f1eee602))
* set vite base to '/' for root GitHub Pages domain ([3b39551](https://github.com/AIssoufi/issoufi.fr/commit/3b39551bba1c8fa2fff4f38b5150f290ec3c798b))
* skip the particle animation when 2D canvas is unavailable ([7cce600](https://github.com/AIssoufi/issoufi.fr/commit/7cce600519fd04a4e16563f74e18a13038cd554f))
* stop the like button from opening the project link ([479ef9c](https://github.com/AIssoufi/issoufi.fr/commit/479ef9c8eddcc59b3627fbc8a8dff15c02a9c310))
* update skills page to reflect current experience ([e39b3ad](https://github.com/AIssoufi/issoufi.fr/commit/e39b3ad01432b3fe6b3ff7c368f40503a6e78a9a))


### Code Refactoring

* apply glassmorphism and modern styles to all page components ([3da7ce9](https://github.com/AIssoufi/issoufi.fr/commit/3da7ce9c49a91a78aa81755649e8649eef2cccb8))
* design tokens with xstyled, extracted logic and hooks, two fixes ([e65876f](https://github.com/AIssoufi/issoufi.fr/commit/e65876f905d16d51f31d95e11091498f8eff6aed))
* drop unused like fields from the project card ([f225d15](https://github.com/AIssoufi/issoufi.fr/commit/f225d15c0a926033947b49e1e9050e48734a2d1b))
* english readme, extract bg images to props, remove modal ([75fc85d](https://github.com/AIssoufi/issoufi.fr/commit/75fc85d5e7494e0b67cd19778117293b6101fb19))
* extract named constants, pure helpers and tested hooks ([a44230e](https://github.com/AIssoufi/issoufi.fr/commit/a44230e0ec83dc7afed7e7d471c4b317d7ff0184))
* import styled-components APIs from xstyled only ([188dbd1](https://github.com/AIssoufi/issoufi.fr/commit/188dbd1fba7fd4d9d59fe82a99f1e269dadac676))
* make component props optional and handle missing values ([a659bab](https://github.com/AIssoufi/issoufi.fr/commit/a659bab8d7250ca07e4ce488cf0187e27a2724f5))
* merge role timeline into main timeline and add dynamic duration ([6280287](https://github.com/AIssoufi/issoufi.fr/commit/62802877c32b44774c39b686f2248aabfadb175b))
* migrate all static assets from Firebase Storage to the local public directory ([a3fcc66](https://github.com/AIssoufi/issoufi.fr/commit/a3fcc662d75514f1122e1eee10c137dfe31e6db2))
* migrate css to styled-components and update readme ([8a7c708](https://github.com/AIssoufi/issoufi.fr/commit/8a7c708feb51c3742419608f7e7b31a7c88d1ed3))
* modernize design system and header styles ([93f1400](https://github.com/AIssoufi/issoufi.fr/commit/93f14005ceb06a516fd0dccc5465f0582e89319e))
* move shared Experiences components to the page root ([82e20fd](https://github.com/AIssoufi/issoufi.fr/commit/82e20fd6441d9ac15984db0527697c29012c734b))
* pass named parameter objects to multi-argument helpers ([edab31c](https://github.com/AIssoufi/issoufi.fr/commit/edab31ccaf750a4d83cd119f1cdb4646dcb663f3))
* redesign experience page with timeline grid, styled lists and improved UX ([8941b3f](https://github.com/AIssoufi/issoufi.fr/commit/8941b3f2e7da6b2bb7ca94cc1d8c21ac4446bb81))
* replace header lang switch with fixed sticky toggle component ([5a311f1](https://github.com/AIssoufi/issoufi.fr/commit/5a311f1549e5f2629281bb643bfdf3b1741a530e))
* translate nav labels to english and remove unused tailwind ([dcffafa](https://github.com/AIssoufi/issoufi.fr/commit/dcffafa26ddb43364afa0b75b6fa114c0da88265))
* type the Lottie refs of BurgerMenu ([cee7448](https://github.com/AIssoufi/issoufi.fr/commit/cee74484ecc13f8b395e75726e27ddcfb70d8aef))
* use English names for identifiers and comments ([b8a0194](https://github.com/AIssoufi/issoufi.fr/commit/b8a01944672649c4a287d8ae51dd672565746ef9))


### Documentation

* add Cloudflare Pages deployment section ([b3a6bac](https://github.com/AIssoufi/issoufi.fr/commit/b3a6bac85e7f00352517c2d5c023715cc2028fbb))
* add JSDoc to career helpers, DocumentMeta and NavMenu ([023166c](https://github.com/AIssoufi/issoufi.fr/commit/023166cd2a97544743c0e9e1335409cbeebd500b))
* add JSDoc to the remaining components, types and translations ([62386e2](https://github.com/AIssoufi/issoufi.fr/commit/62386e2aea4db9b1db610008a17c02a9eb93678e))
* describe component structure and error pages in CLAUDE.md ([67ad7df](https://github.com/AIssoufi/issoufi.fr/commit/67ad7df88a42fcd86bccea8efc8a5dbb6438a9f2))
* describe the default branch and the branch protections ([16574d4](https://github.com/AIssoufi/issoufi.fr/commit/16574d4e63b9436c80ae2ca7a27ac56a5ee7dbaf))
* remove JSDoc from NavMenu styled-components ([77960c0](https://github.com/AIssoufi/issoufi.fr/commit/77960c06a43320ebf3f4d10a603682d2fdd95ca2))


### Continuous Integration

* generate the changelog and the releases with release-please ([1d4125b](https://github.com/AIssoufi/issoufi.fr/commit/1d4125b837f4820ab933749166d0ff546af5c25b))
