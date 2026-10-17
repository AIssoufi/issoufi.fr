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

- [Node.js](https://nodejs.org/) (LTS recommended)
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
