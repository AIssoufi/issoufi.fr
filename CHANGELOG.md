# Changelog

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
* import styled-components APIs from xstyled only ([9fe6262](https://github.com/AIssoufi/issoufi.fr/commit/9fe62625f6db641e19530600d681f200c7cf52a6))
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
