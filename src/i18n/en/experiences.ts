import type { Translations } from '../types.ts';

/** English texts of the experiences page, loaded with its chunk. */
export const enExperiences = {
  pageTitle: 'Experience',
  duration: {
    years_one: '{{count}} year',
    years_other: '{{count}} years',
    months_one: '{{count}} month',
    months_other: '{{count}} months',
    lessThanAMonth: '< 1 month',
  },
  periodTo: 'to',
  sewan: {
    name: 'Sewan Groupe',
    contract: 'Permanent',
    city: 'Paris\u00a0(75)',
  },
  sewanCore: {
    title: 'Senior Front-End Developer, Core team',
    start: 'Oct. 2025',
    end: 'Present',
    intro:
      'One of the three front-end developers of the Core team, born from the merger of Core Front and Core Back. I remain the owner of the UI Kit and work on cross-team topics.',
    b1: 'Development with AI agents (Claude Code, Codex, OpenCode), after GitHub Copilot then Cursor: MCP servers (Jira, Confluence, Chrome DevTools, Figma, GitLab), specialized subagents, in-house skills and rules, three or four topics in parallel with Git worktree',
    b2: 'E-invoicing (France, Belgium, Spain), catalog and pricing, stock and rental, dashboards, integration of the PHP legacy',
    b3: 'UI Kit filters, one of the most used components: from a monolithic architecture to 13 composable packages, then migration of every page, some twenty inconsistencies fixed',
  },
  sewanUiKit: {
    title: 'Senior Front-End Developer · UI Kit Owner',
    start: 'Oct. 2022',
    end: 'Sept. 2025',
    intro1: 'Owner of the internal UI Kit of the Core Front team: ',
    introStrong: '118 React and TypeScript packages',
    intro2:
      ' published on a private NPM registry, used by 15 product teams and by 47 of the 49 applications of the platform. Top contributor of the repository (1,040 commits among 80 contributors), author of 67 packages.',
    b1: 'Composable architecture: legacy single package split into separately versioned packages (Lerna 8, Changesets), Form into 9 packages, Table v2 designed as 11 packages with 15 features, virtualization included',
    b2: 'Customizable theme of the white-label offer, text color computed from the background to keep the contrast; design tokens from the designers (Figma) ported into the theme (xstyled), no raw value allowed',
    b3: '2,389 major versions over the 293 packages of its history; fixed a bug where a BREAKING CHANGE only bumped the patch, leaving the 15 teams without a breaking signal',
    b4: 'Components ready for the end-to-end tests of QA: each app passes its own test ids for the page, unified props (old ones deprecated without breaking change), no default test id',
    b5: 'Technical point of contact for 15 teams: author of the documentation and of the contribution processes, 458 merge requests approved over 11 repositories, led 5 epics and 5 scoping studies',
    proj1Title: 'Tooling overhaul, with no breaking change for the consuming teams',
    proj1B1: 'Full TypeScript migration: 771 files, no JavaScript left',
    proj1B2: 'npm to pnpm, Node 16 to 22, Jest to Vitest, Webpack to tsup and Vite, Lerna 4 to 8',
    proj1B3:
      'Storybook 5.3 to 9 (CSF 3, Chromatic, test-runner): 151 stories, changelog of each package, deprecated badges',
    proj1B4:
      'Median merge request pipeline time cut from 17 min 24 s to 9 min (48% less, over 2,600 jobs)',
    proj1B5:
      '661 tests in 142 files, 93 of the 118 packages with at least one test, 33 seconds to run',
  },
  sewanFoundation: {
    title: 'Front-End Developer · Sophia GO application foundation',
    start: 'June 2021',
    end: 'Sept. 2022',
    intro1: 'Built the foundation of the React monorepo of ',
    introStrong: 'Sophia GO',
    intro2: ', the new Sewan platform, from its start: 611 commits and 245 tickets delivered.',
    b1: 'Application shell of the 49 applications of the monorepo: responsive layout, contextual sidebar, top bar, three-level navigation (organizations, sites, accounts)',
    b2: 'Front-end permissions and feature flagging (Optimizely), still used by every team to ship continuously',
    b3: 'Three applications built from scratch, bridges with the legacy platform, internationalization (i18next, Lokalise), first GraphQL resolvers',
  },
  wibilong: {
    title: 'Full-stack JavaScript Engineer (React.js, Redux.js, Node.js and AWS)',
    name: 'Wibilong',
    contract: 'Permanent',
    city: 'Paris\u00a0(75)',
    start: 'Sept. 2019',
    end: 'June 2021',
    intro:
      "Front-end and back-end development of Wibilong's three SaaS products (WiService V3, WiManager, WiSell), within a two-developer team.",
    b1: 'Screens built from the product mockups, then the services they need (Node.js APIs and AWS serverless functions), documented with Swagger',
    b2: 'Production maintenance and bug fixing on the three products',
    b3: 'Took part in the technical choices of WiService V3',
  },
  supralog: {
    name: 'Supralog',
    contract: 'Apprenticeship',
    city: 'Antibes\u00a0(06)',
  },
  supralogClaris: {
    title: 'JavaScript Apprentice Developer (React.js and Redux.js)',
    start: 'Jan. 2019',
    end: 'Sept. 2019',
    proj1Title: 'CLARIS: Certification IS Overhaul',
    proj1State: '3 sprints delivered',
    proj1Desc1:
      'Within a team of seven developers, took part in the front-end overhaul of the CLARIS information system, built for ',
    proj1Strong: 'Eurovent Certita Certification SAS',
    proj1Desc2: ', the European leader in certification.',
  },
  supralogFfbad: {
    title: 'Full-Stack JavaScript Apprentice Developer (React.js, Redux.js, Next.js, Docker, GCP)',
    start: 'June 2018',
    end: 'Mar. 2019',
    proj1Title: 'MyFFBaD: FFBaD Licensee Portal',
    proj1State: 'Delivered on time',
    proj1Desc1:
      'In a pair, from-scratch development of the front-end pages of the licensee portal of the ',
    proj1Strong: 'French Badminton Federation',
    proj1Desc2:
      ' (190,000 licensees) from the mockups and specifications, then implementation and deployment of 3 microservices.',
  },
  beepeers: {
    title: 'React.js Developer',
    name: 'Beepeers',
    contract: 'Internship',
    city: 'Valbonne\u00a0(06)',
    start: 'May 2017',
    end: 'Aug. 2017',
    proj1Title: 'Dream Nation Festival 2017: Event Website',
    proj1State: 'Delivered on time',
    proj1Desc:
      'Design and development of the festival website, with a booking (ticket and hotel) and online payment system.',
    proj1B1: 'Design: screen mockups, architecture',
    proj1B2:
      'React development, partly from existing components; ticket and hotel booking (Fasticket) and card payment (Weezevent)',
    proj1B3: 'Maintenance of existing AngularJS websites',
  },
} as const satisfies Translations['exp'];
