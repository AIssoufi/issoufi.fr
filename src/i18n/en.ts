import type { Translations } from './types.ts';

/**
 * English translations. Typed with {@link Translations}, so they must keep exactly the keys of the
 * French ones in `fr.ts`: `tsc` names a key missing from either file. As in `fr.ts`, a no-break
 * space joins the words that belong together on a line, such as "UI\u00a0Design".
 */
export const en = {
  meta: {
    home: {
      title: 'ADAM Issoufi - Full-stack JavaScript Developer',
      description:
        'Full-stack JavaScript developer with {{years}} years of experience, specializing in React.',
    },
    projects: {
      title: 'Projects - ADAM Issoufi',
      description:
        'Personal and freelance projects by ADAM Issoufi, full-stack JavaScript developer.',
    },
    experiences: {
      title: 'Experience - ADAM Issoufi',
      description:
        'Professional background of ADAM Issoufi, full-stack JavaScript developer: Sewan, Wibilong, Supralog and Beepeers.',
    },
    notFound: {
      title: 'Page not found - ADAM Issoufi',
      description: 'This page does not exist.',
    },
    ogImageAlt: 'ADAM Issoufi, full-stack JavaScript developer with a passion for UX and UI Design',
    siteName: 'ADAM Issoufi',
    ownerName: 'ADAM Issoufi',
    webApp: {
      name: 'ADAM Issoufi - Full-stack JavaScript Developer',
      shortName: 'ADAM Issoufi',
      description:
        'Full-stack JavaScript developer with {{years}} years of experience, specializing in React.',
    },
  },
  errors: {
    backHome: 'Back to home',
    notFound: {
      title: 'Page not found',
      message: 'The page {{path}} does not exist.',
      messageWithoutPath: 'This page does not exist.',
    },
    forbidden: {
      title: 'Access denied',
      message: 'You do not have permission to access this page.',
    },
    unexpected: {
      title: 'Something went wrong',
      message: 'This page could not be displayed. Reload it to try again.',
      reload: 'Reload the page',
    },
  },
  nav: {
    home: 'Home',
    projects: 'Projects',
    experience: 'Experience',
  },
  langToggle: {
    label: 'Language',
  },
  burgerMenu: {
    open: 'Open menu',
    close: 'Close menu',
  },
  header: {
    buildVersion: 'build {{version}}',
  },
  skipLink: {
    text: 'Skip to content',
  },
  githubLink: {
    label: "ADAM Issoufi's GitHub profile",
  },
  linkedInLink: {
    label: "ADAM Issoufi's LinkedIn profile",
  },
  cvLink: {
    text: 'Download CV',
    documentName: 'CV',
  },
  newTabLink: {
    notice: '(opens in a new tab)',
  },
  home: {
    title1: 'Full-stack JavaScript Developer',
    title2Pre: 'passionate about ',
    title2Mid: ' and ',
    title2Post: '\u00a0Design',
    subtitle: 'I help you build web\u00a0applications',
    cta: 'View my projects',
    secondary: 'Professional experience',
  },
  projects: {
    pageTitle: 'Projects',
    personal: 'Personal projects',
    freelance: 'Freelance projects',
    showLess: 'Show less',
    showAll: 'Show all ({{count}})',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    like: 'Like {{name}}',
    names: {
      chess: 'Chess game',
      audioPluginStore: 'Audio plugin store',
      connectFour: 'Connect Four',
      calculator: 'Calculator',
      studySarl: 'Study SARL',
      kaneRivieraTransfert: 'Kane Riviera Transfert',
      trouilletDecors: 'Trouillet Décors',
      yyServicies: 'Y-YServicies',
      babyGifts: 'Baby gifts',
    },
    types: {
      webApp: 'Web application',
      website: 'Website',
      showcaseWebsite: 'Brochure website',
    },
  },
  exp: {
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
    sewanLead: {
      title: 'Lead Frontend Engineer — UI Kit Owner & Architect',
      start: 'Aug. 2021',
      end: 'Present',
      intro1:
        "Owner and technical lead of Sewan's internal UI Kit — a React component library distributed to ",
      introStrong: '~15 product teams',
      intro2:
        ' via a private NPM registry. Single point of contact between design system teams, consuming developers and technical management.',
      b1: 'Design and evolution of robust React + TypeScript component APIs, documented in Storybook, following a TDD approach',
      b2: 'Backlog prioritization, gathering and arbitrating requirements from ~15 teams',
      b3: 'Cross-team support: onboarding, code review, debugging and training of consuming teams',
      proj1Title: 'Complete stack modernization',
      proj1State: 'In production',
      proj1Intro:
        'End-to-end technical overhaul led solo to modernize tooling and significantly improve developer experience (DX):',
      proj1B1: 'Storybook v5.3 → v8.6 (CSF 2 → CSF 3 migration), Node.js v16 → v22',
      proj1B2: 'Jest → Vitest, Webpack → tsup + Vite (significantly faster builds)',
      proj1B3: 'npm + Lerna v4 → pnpm + Lerna v8; switch to strict TypeScript',
      proj1B4: 'Complete CI/CD GitLab pipeline overhaul',
    },
    sewanSenior: {
      title: 'Senior Full-Stack Engineer — Core Platform (React, Node.js, GraphQL)',
      start: 'June 2021',
      end: 'Present',
      intro1: 'Core team member (3 developers) responsible for the technical foundations of ',
      introStrong: 'Sophia Go',
      intro2: ", Sewan's central business platform.",
      b1: 'Design of cross-functional front-end architecture: global store, common business logic, shared configuration and internal libraries used by all feature teams',
      b2: 'Full-stack development of critical modules: React/TypeScript client-side, Node.js/GraphQL server-side',
      b3: 'Driving major technical evolutions and supporting teams in their adoption',
      proj1Title: 'friday — GraphQL BFF',
      proj1Desc:
        'Design and development of a GraphQL Backend-For-Frontend decoupling the front-end from back-end microservices. Simplifies API contracts and reduces coupling between teams.',
      proj2Title: 'onboarding-app — React Client Portal',
      proj2Desc:
        'From-scratch development of the React onboarding application for the Sophia Go platform — the critical entry point for new Sewan clients.',
    },
    wibilong: {
      title: 'Full-Stack JavaScript Engineer — React, Node.js, AWS',
      name: 'Wibilong',
      contract: 'Permanent',
      city: 'Paris\u00a0(75)',
      start: 'Sept. 2019',
      end: 'June 2021',
      intro:
        "End-to-end full-stack development of Wibilong's SaaS solutions (WiService V3, WiManager, WiSell), within a two-developer team.",
      b1: 'End-to-end feature development: from product mockup to production, front-end (React, Redux) and back-end (Node.js, serverless AWS)',
      b2: 'REST API design and documentation under Swagger; deployment via AWS Lambda, API Gateway and CloudFormation',
      b3: 'Production maintenance and bug resolution',
    },
    supralog: {
      title: 'Full-Stack JavaScript Developer — Apprenticeship',
      name: 'Supralog',
      contract: 'Apprenticeship',
      city: 'Antibes\u00a0(06)',
      start: 'June 2018',
      end: 'Sept. 2019',
      proj1Title: 'MyFFBaD — FFBaD Licensee Portal',
      proj1State: 'Delivered on time',
      proj1Desc1: 'In a pair, from-scratch development of the licensee portal for the ',
      proj1Strong: 'French Badminton Federation',
      proj1Desc2:
        ' from mockups and specifications — then design, implementation and deployment of 3 microservices on GCP.',
      proj2Title: 'CLARIS — Certification IS Overhaul',
      proj2State: '3 sprints delivered',
      proj2Desc1:
        'Within a 7-developer team, participation in the front-end overhaul of the CLARIS IS for ',
      proj2Strong: 'Eurovent Certita Certification SAS',
      proj2Desc2: ', a European leader in industrial certification.',
    },
    beepeers: {
      title: 'React.js Developer — Internship',
      name: 'Beepeers',
      contract: 'Internship',
      city: 'Valbonne\u00a0(06)',
      start: 'May 2017',
      end: 'Aug. 2017',
      proj1Title: 'Dream Nation Festival 2017 — Event Website',
      proj1State: 'Delivered on time',
      proj1Desc:
        'Complete design and development of an event website with reservation system and online payment.',
      proj1B1: 'Screen architecture and mockups',
      proj1B2:
        'React development with ticketing integration (Fasticket) and card payment (Weezevent)',
      proj1B3: 'Maintenance of existing AngularJS websites',
    },
  },
} as const satisfies Translations;
