import type { AppTranslations } from '../types.ts';

/** English texts of the app, loaded with it: every text but those of the lazy pages. */
export const enApp = {
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
} as const satisfies AppTranslations;
