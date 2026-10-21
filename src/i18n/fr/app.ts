/** French texts of the app, loaded with it: every text but those of the lazy pages. */
export const frApp = {
  meta: {
    home: {
      title: 'ADAM Issoufi - Développeur full-stack JavaScript',
      description:
        'Développeur full-stack JavaScript avec {{years}} ans d’expérience, spécialisé React.',
    },
    projects: {
      title: 'Projets - ADAM Issoufi',
      description:
        'Projets personnels et freelance d’ADAM Issoufi, développeur full-stack JavaScript.',
    },
    experiences: {
      title: 'Expériences - ADAM Issoufi',
      description:
        'Parcours professionnel d’ADAM Issoufi, développeur full-stack JavaScript\u00a0: Sewan, Wibilong, Supralog et Beepeers.',
    },
    notFound: {
      title: 'Page introuvable - ADAM Issoufi',
      description: 'Cette page n’existe pas.',
    },
    ogImageAlt: 'ADAM Issoufi, développeur full-stack JavaScript passionné par l’UX et l’UI Design',
    // The names of the site and of its owner, which link previews (og:site_name) and search
    // engines (the structured data of the pages) show: the same for now, kept apart so that
    // either can change alone
    siteName: 'ADAM Issoufi',
    ownerName: 'ADAM Issoufi',
    // The texts of the installed app (its web app manifest): the title and the description of the
    // home page for now, kept apart so that either can change alone
    webApp: {
      name: 'ADAM Issoufi - Développeur full-stack JavaScript',
      shortName: 'ADAM Issoufi',
      description:
        'Développeur full-stack JavaScript avec {{years}} ans d’expérience, spécialisé React.',
    },
  },
  errors: {
    backHome: 'Retour à l’accueil',
    notFound: {
      title: 'Page introuvable',
      message: 'La page {{path}} n’existe pas.',
      // The page rendered at build time, which cannot know the path that the visitor typed
      messageWithoutPath: 'Cette page n’existe pas.',
    },
    unexpected: {
      title: 'Une erreur est survenue',
      message: 'Cette page n’a pas pu s’afficher. Rechargez-la pour réessayer.',
      reload: 'Recharger la page',
    },
  },
  nav: {
    home: 'Accueil',
    projects: 'Projets',
    experience: 'Expériences',
  },
  langToggle: {
    label: 'Langue',
  },
  burgerMenu: {
    open: 'Ouvrir le menu',
    close: 'Fermer le menu',
  },
  header: {
    buildVersion: 'build {{version}}',
  },
  skipLink: {
    text: 'Aller au contenu',
  },
  githubLink: {
    label: 'Profil GitHub d’ADAM Issoufi',
  },
  linkedInLink: {
    label: 'Profil LinkedIn d’ADAM Issoufi',
  },
  cvLink: {
    text: 'Télécharger CV',
    // Name of the document that the link downloads, which `pnpm cv` writes in its title
    documentName: 'CV',
  },
  newTabLink: {
    // Read by screen readers after the text of every link that opens a new tab
    notice: '(nouvel onglet)',
  },
  home: {
    title1: 'Développeur full-stack JavaScript',
    title2Pre: 'passionné par l’',
    title2Mid: ' et l’',
    title2Post: '\u00a0Design',
    subtitle: 'Je vous aide à développer vos applications\u00a0web',
    cta: 'Voir mes projets',
    secondary: 'Expériences professionnelles',
  },
} as const;
