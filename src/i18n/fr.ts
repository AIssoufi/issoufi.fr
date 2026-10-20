/**
 * French translations: the default and fallback language. Also the source of the static page
 * metadata generated at build time.
 *
 * Following French typography, a colon comes after a no-break space (`\u00a0`), and a semicolon,
 * question or exclamation mark after a narrow no-break space (`\u202f`), so that they never wrap
 * alone onto the next line. Apostrophes are typographic (’), never straight ('). A no-break space
 * also joins the words that belong together on a line, such as "UI\u00a0Design",
 * "applications\u00a0web" or a city and its department ("Paris\u00a0(75)"), and the same words in
 * `en.ts`.
 */
export const fr = {
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
    forbidden: {
      title: 'Accès refusé',
      message: 'Vous n’avez pas l’autorisation d’accéder à cette page.',
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
  projects: {
    pageTitle: 'Projets',
    personal: 'Projets personnels',
    freelance: 'Projets freelance',
    showLess: 'Afficher moins',
    showAll: 'Tout afficher ({{count}})',
    previousPage: 'Page précédente',
    nextPage: 'Page suivante',
    like: 'Aimer {{name}}',
    // Texts of the cards, by the nameKey and typeKey of the projects of src/pages/Projects/.data.
    // Client names are proper nouns, written the same in every language
    names: {
      chess: 'Jeu d’échecs',
      audioPluginStore: 'Magasin de plugins audio',
      connectFour: 'Puissance 4',
      calculator: 'Calculatrice',
      studySarl: 'Study SARL',
      kaneRivieraTransfert: 'Kane Riviera Transfert',
      trouilletDecors: 'Trouillet Décors',
      yyServicies: 'Y-YServicies',
      babyGifts: 'Cadeaux de naissance',
    },
    types: {
      webApp: 'Application web',
      website: 'Site web',
      showcaseWebsite: 'Site vitrine',
    },
  },
  exp: {
    pageTitle: 'Expériences',
    duration: {
      years_one: '{{count}} an',
      years_other: '{{count}} ans',
      months_one: '{{count}} mois',
      months_other: '{{count}} mois',
      lessThanAMonth: '< 1 mois',
    },
    // Read by screen readers between the start and the end of a period, in place of the arrow or
    // the dash that the screen shows between them
    periodTo: 'à',
    sewan: {
      name: 'Sewan Groupe',
      contract: 'CDI',
      city: 'Paris\u00a0(75)',
    },
    sewanCore: {
      title: 'Développeur Front-End Senior, équipe Core',
      start: 'oct. 2025',
      end: 'Aujourd’hui',
      intro:
        'L’un des trois développeurs front de l’équipe Core, née de la fusion du Core Front et du Core Back. Je reste responsable de l’UI Kit et j’interviens sur le transverse.',
      b1: 'Développement avec des agents IA (Claude Code, Codex, OpenCode)\u00a0: sous-agents spécialisés, skills et rules maison, trois ou quatre sujets en parallèle avec Git worktree',
      b2: 'Facturation électronique (France, Belgique, Espagne), catalogue et prix, stock et location, tableaux de bord, intégration du legacy PHP',
      b3: 'Filtres de l’UI Kit, l’un des composants les plus utilisés\u00a0: d’une architecture monolithique à 13 packages composables, puis migration de toutes les pages, une vingtaine d’incohérences corrigées',
    },
    sewanUiKit: {
      title: 'Développeur Front-End Senior · Responsable de l’UI Kit',
      start: 'oct. 2022',
      end: 'sept. 2025',
      intro1: 'Responsable de l’UI Kit interne de l’équipe Core Front\u00a0: ',
      introStrong: '118 packages React et TypeScript',
      intro2:
        ' publiés sur un registre NPM privé, consommés par 15 équipes produit et par 47 des 49 applications de la plateforme. Premier contributeur du dépôt (1\u202f040 commits sur 80 contributeurs), auteur de 67 packages.',
      b1: 'Architecture composable\u00a0: monopackage historique éclaté en packages versionnés séparément (Form en 9 packages), Table v2 conçue en 11 packages et 15 fonctionnalités, dont la virtualisation',
      b2: 'Thème personnalisable qui rend possible l’offre en marque blanche, contrastes calculés automatiquement',
      b3: 'Point d’entrée technique de 15 équipes (revue, support, documentation), pilotage de 5 epics et de 5 études de cadrage',
      proj1Title: 'Refonte de l’outillage, sans rupture pour les équipes consommatrices',
      proj1B1: 'Migration TypeScript intégrale\u00a0: 771 fichiers, plus aucun JavaScript',
      proj1B2:
        'npm vers pnpm, Node 16 vers 22, Jest vers Vitest, Webpack vers tsup et Vite, Storybook 5.3 vers 9, Lerna 4 vers 8',
      proj1B3:
        'Temps médian du pipeline de merge request ramené de 17\u00a0min 24\u00a0s à 9\u00a0min, soit 48\u202f% de moins, mesuré sur 2\u202f600 jobs',
      proj1B4:
        '661 tests sur 142 fichiers, 79\u202f% des packages couverts, 33\u00a0secondes d’exécution',
    },
    sewanFoundation: {
      title: 'Développeur Front-End · Socle applicatif Sophia GO',
      start: 'juin 2021',
      end: 'sept. 2022',
      intro1: 'Construction du socle du monorepo React de ',
      introStrong: 'Sophia GO',
      intro2:
        ', la nouvelle plateforme de Sewan, dès son démarrage\u00a0: 611 commits et 245 tickets livrés.',
      b1: 'Châssis applicatif des 49 applications du monorepo\u00a0: layout responsive, sidebar contextuelle, topbar, navigation sur trois niveaux (organisations, sites, comptes)',
      b2: 'Permissions front et feature flagging (Optimizely), toujours utilisés par toutes les équipes pour livrer en continu',
      b3: 'Trois applications créées de zéro, passerelles avec la plateforme historique, internationalisation (i18next, Lokalise), premiers resolvers GraphQL',
    },
    wibilong: {
      title: 'Full-stack JavaScript Engineer (React.js, Redux.js, Node.js and AWS)',
      name: 'Wibilong',
      contract: 'CDI',
      city: 'Paris\u00a0(75)',
      start: 'sept. 2019',
      end: 'juin 2021',
      intro:
        'Développement des fonctionnalités front et back des trois solutions SaaS de Wibilong (WiService V3, WiManager, WiSell), au sein d’une équipe de deux développeurs.',
      b1: 'Réalisation des écrans à partir des maquettes produit, puis des services nécessaires à leur fonctionnement (API Node.js et fonctions serverless AWS), documentés avec Swagger',
      b2: 'Maintien en condition opérationnelle et correction d’anomalies sur les trois produits',
      b3: 'Participation aux choix techniques de la V3 de WiService',
    },
    supralog: {
      name: 'Supralog',
      contract: 'Alternance',
      city: 'Antibes\u00a0(06)',
    },
    supralogClaris: {
      title: 'Apprenti développeur JavaScript (React.js et Redux.js)',
      start: 'janv. 2019',
      end: 'sept. 2019',
      proj1Title: 'CLARIS\u00a0: refonte du SI de certification',
      proj1State: '3 sprints livrés',
      proj1Desc1:
        'Au sein d’une équipe de sept développeurs, participation à la refonte du front-end du SI CLARIS, conçu pour ',
      proj1Strong: 'Eurovent Certita Certification SAS',
      proj1Desc2: ', leader européen de la certification.',
    },
    supralogFfbad: {
      title:
        'Apprenti développeur full-stack JavaScript (React.js, Redux.js, Next.js, Docker, GCP)',
      start: 'juin 2018',
      end: 'mars 2019',
      proj1Title: 'MyFFBaD\u00a0: espace licencié de la FFBaD',
      proj1State: 'Livré dans les délais',
      proj1Desc1:
        'En binôme, développement from scratch des pages front de l’espace licencié de la ',
      proj1Strong: 'Fédération Française de Badminton',
      proj1Desc2:
        ' (190\u202f000 licenciés) à partir des maquettes et du cahier des charges, puis implémentation et déploiement de 3 microservices.',
    },
    beepeers: {
      title: 'Développeur React.js',
      name: 'Beepeers',
      contract: 'Stage',
      city: 'Valbonne\u00a0(06)',
      start: 'mai 2017',
      end: 'août 2017',
      proj1Title: 'Dream Nation Festival 2017\u00a0: site événementiel',
      proj1State: 'Livré dans les délais',
      proj1Desc:
        'Conception et réalisation du site du festival, avec un système de réservation (billet et hôtel) et de paiement en ligne.',
      proj1B1: 'Conception\u00a0: maquettes des écrans, architecture',
      proj1B2:
        'Réalisation en React, en partie à partir de composants existants\u202f; réservation de billet et d’hôtel (Fasticket) et paiement par carte bancaire (Weezevent)',
      proj1B3: 'Maintenance des sites existants en AngularJS',
    },
  },
} as const;
