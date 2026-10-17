# issoufi-v3

> Personal portfolio of **ADAM Issoufi** — Full-stack JavaScript developer with a passion for UX and UI Design.

## 🛠 Tech Stack

| Category            | Technologies        |
| ------------------- | ------------------- |
| **Framework**       | React 19            |
| **Build**           | Vite 6              |
| **Language**        | TypeScript 5        |
| **Styling**         | styled-components 6 |
| **Routing**         | React Router 7      |
| **Package Manager** | pnpm                |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`)
- [pnpm](https://pnpm.io/)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Production

```bash
pnpm build
pnpm preview
```

### Tests

```bash
pnpm test          # Single run
pnpm test:watch    # Watch mode
```

## 🌐 Deployment

The site is deployed on [Cloudflare Pages](https://pages.cloudflare.com/) at [issoufi.fr](https://issoufi.fr/).

| Setting                | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| Production branch      | `main`                                                         |
| Framework preset       | None                                                           |
| Root directory         | `/` (default)                                                  |
| Build command          | `pnpm build`                                                   |
| Build output directory | `dist`                                                         |
| Node.js version        | `24`, read from `.nvmrc`                                       |
| Package manager        | pnpm, detected from `pnpm-lock.yaml`                           |
| Environment variables  | `PNPM_VERSION=10.34.7` (same major version as the CI, pnpm 10) |

- **One HTML file per page**: at build time, a Vite plugin (`vite.config.ts`) fills the `%PAGE_*%` placeholders of `index.html` and emits `projects.html` and `experiences.html` from the same template. Each page gets its own title, description and canonical URL, taken from the `meta` translations of `src/i18n/fr.ts`, so link previews and search engines get them without running JavaScript. Cloudflare Pages serves these files at `/projects` and `/experiences`. A new route needs an entry in `PAGES` (`src/utils/pages.ts`).
- **Single-page application**: `dist` must not contain a top-level `404.html`. Without it, Cloudflare Pages serves `index.html` for any path that matches no file.
- **Years of experience**: the number in the generated HTML files is computed at build time from `CAREER_START_DATE` (`src/utils/career.ts`), so it only changes with a new build. The app itself computes it at runtime.

## 📁 Project Structure

```
src/
├── App/                  # Root component & layout
│   ├── Header/           # Navigation, burger menu, links
│   └── Modal/            # Informational modal
├── pages/
│   ├── Home/             # Landing page
│   ├── Projects/         # Personal & freelance projects
│   ├── Experiences/      # Work experience
│   └── NotFound/         # 404 page
└── index.tsx             # Entry point
```

## 📝 Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) enforced via commitlint
- **Formatting**: Prettier (via lint-staged + husky)
