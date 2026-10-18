/**
 * French translations: the default and fallback language. Also the source of the static page
 * metadata generated at build time.
 *
 * Following French typography, a colon comes after a no-break space (`\u00a0`), and a semicolon,
 * question or exclamation mark after a narrow no-break space (`\u202f`), so that they never wrap
 * alone onto the next line. Apostrophes are typographic (’), never straight (').
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
    noScript: 'Activez JavaScript pour afficher ce site.',
  },
  errors: {
    backHome: 'Retour à l’accueil',
    notFound: {
      title: 'Page introuvable',
      message: 'La page {{path}} n’existe pas.',
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
  githubLink: {
    label: 'Profil GitHub d’ADAM Issoufi',
  },
  cvLink: {
    text: 'CV',
    label: 'Télécharger le CV',
  },
  home: {
    title1: 'Développeur full-stack JavaScript',
    title2Pre: 'passionné par l’',
    title2Mid: ' et l’',
    title2Post: ' Design',
    subtitle: 'Je vous aide à développer vos applications web',
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
      city: 'Paris (75)',
    },
    sewanLead: {
      title: 'Lead Frontend Engineer — UI Kit Owner & Architect',
      start: 'août 2021',
      end: 'Aujourd’hui',
      intro1:
        'Owner et référent technique de l’UI Kit interne Sewan — bibliothèque de composants React distribuée à ',
      introStrong: '~15 équipes produit',
      intro2:
        ' via un registre NPM privé. Interlocuteur unique entre les équipes design system, les développeurs consommateurs et la direction technique.',
      b1: 'Conception et évolution d’API de composants React + TypeScript robustes, documentées sous Storybook, suivant une approche TDD',
      b2: 'Priorisation du backlog, recueil et arbitrage des besoins auprès de ~15 équipes',
      b3: 'Accompagnement transverse\u00a0: onboarding, code review, debug et formation des équipes consommatrices',
      proj1Title: 'Modernisation complète de la stack technique',
      proj1State: 'En production',
      proj1Intro:
        'Refonte technique de bout en bout menée en solo pour moderniser l’outillage et améliorer significativement l’expérience développeur (DX)\u00a0:',
      proj1B1: 'Storybook v5.3 → v8.6 (migration CSF 2 → CSF 3), Node.js v16 → v22',
      proj1B2: 'Jest → Vitest, Webpack → tsup + Vite (builds sensiblement plus rapides)',
      proj1B3: 'npm + Lerna v4 → pnpm + Lerna v8\u202f; passage à TypeScript strict',
      proj1B4: 'Refonte intégrale du pipeline CI/CD GitLab',
    },
    sewanSenior: {
      title: 'Senior Full-Stack Engineer — Core Platform (React, Node.js, GraphQL)',
      start: 'juin 2021',
      end: 'Aujourd’hui',
      intro1: 'Membre de l’équipe core (3 développeurs) en charge des fondations techniques de ',
      introStrong: 'Sophia Go',
      intro2: ', la plateforme métier centrale de Sewan.',
      b1: 'Conception de l’architecture front-end transverse\u00a0: store global, logique métier commune, configuration partagée et librairies internes utilisées par toutes les équipes feature',
      b2: 'Développement full-stack de modules critiques\u00a0: React/TypeScript côté client, Node.js/GraphQL côté serveur',
      b3: 'Pilotage des évolutions techniques majeures et accompagnement des équipes dans leur adoption',
      proj1Title: 'friday — BFF GraphQL',
      proj1Desc:
        'Conception et développement d’un Backend-For-Frontend GraphQL découplant le front-end des microservices back-end. Simplifie les contrats d’API et réduit le couplage entre les équipes.',
      proj2Title: 'onboarding-app — Espace client React',
      proj2Desc:
        'Développement from scratch de l’application React d’onboarding client de la plateforme Sophia Go — point d’entrée critique pour les nouveaux clients Sewan.',
    },
    wibilong: {
      title: 'Full-Stack JavaScript Engineer — React, Node.js, AWS',
      name: 'Wibilong',
      contract: 'CDI',
      city: 'Paris (75)',
      start: 'sept. 2019',
      end: 'juin 2021',
      intro:
        'Développement full-stack end-to-end des solutions SaaS Wibilong (WiService V3, WiManager, WiSell), au sein d’une équipe de deux développeurs.',
      b1: 'Développement de nouvelles fonctionnalités de bout en bout\u00a0: de la maquette produit à la mise en production, côté front (React, Redux) et back (Node.js, serverless AWS)',
      b2: 'Conception et documentation d’API REST sous Swagger\u202f; déploiement via AWS Lambda, API Gateway et CloudFormation',
      b3: 'Maintien en condition opérationnelle (MCO) et résolution de bugs en production',
    },
    supralog: {
      title: 'Développeur Full-Stack JavaScript — Alternance',
      name: 'Supralog',
      contract: 'Alternance',
      city: 'Antibes (06)',
      start: 'juin 2018',
      end: 'sept. 2019',
      proj1Title: 'MyFFBaD — Espace licencié FFBaD',
      proj1State: 'Livré dans les délais',
      proj1Desc1: 'En binôme, développement from scratch de l’espace licencié de la ',
      proj1Strong: 'Fédération Française de Badminton',
      proj1Desc2:
        ' à partir des maquettes et du cahier des charges — puis conception, implémentation et déploiement de 3 microservices sur GCP.',
      proj2Title: 'CLARIS — Refonte SI de certification',
      proj2State: '3 sprints livrés',
      proj2Desc1:
        'Au sein d’une équipe de 7 développeurs, participation à la refonte du front-end du SI CLARIS pour ',
      proj2Strong: 'Eurovent Certita Certification SAS',
      proj2Desc2: ', leader européen de la certification industrielle.',
    },
    beepeers: {
      title: 'Développeur React.js — Stage',
      name: 'Beepeers',
      contract: 'Stage',
      city: 'Valbonne (06)',
      start: 'mai 2017',
      end: 'août 2017',
      proj1Title: 'Dream Nation Festival 2017 — Site événementiel',
      proj1State: 'Livré dans les délais',
      proj1Desc:
        'Conception et réalisation complète d’un site événementiel avec système de réservation et paiement en ligne.',
      proj1B1: 'Architecture et maquettes des écrans',
      proj1B2:
        'Développement React avec intégration billetterie (Fasticket) et paiement CB (Weezevent)',
      proj1B3: 'Maintenance des sites existants en AngularJS',
    },
  },
} as const;
