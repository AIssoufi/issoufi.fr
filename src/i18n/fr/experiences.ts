/** French texts of the experiences page, loaded with its chunk. */
export const frExperiences = {
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
    b1: 'Développement avec des agents IA (Claude Code, Codex, OpenCode), après GitHub Copilot puis Cursor\u00a0: serveurs MCP (Jira, Confluence, Chrome DevTools, Figma, GitLab), sous-agents spécialisés, skills et rules maison, trois ou quatre sujets en parallèle avec Git worktree',
    b2: 'Facturation électronique (France, Belgique, Espagne), catalogue et prix, stock et location, tableaux de bord, intégration du legacy PHP',
    b3: 'Filtres de l’UI Kit, l’un des composants les plus utilisés\u00a0: d’une architecture monolithique à 13 packages composables, puis migration de toutes les pages, une vingtaine d’incohérences corrigées',
    cvIntro:
      'L’un des trois développeurs front de l’équipe Core. Je reste responsable de l’UI Kit.',
    cvB1: 'Développement avec des agents IA (Claude Code, Codex, OpenCode), après GitHub Copilot puis Cursor\u00a0: serveurs MCP, sous-agents spécialisés, skills et rules maison, trois ou quatre sujets en parallèle avec Git worktree',
    cvB2: 'Facturation électronique (France, Belgique, Espagne), catalogue et prix, tableaux de bord, intégration du legacy PHP',
  },
  sewanUiKit: {
    title: 'Développeur Front-End Senior · Responsable de l’UI Kit',
    start: 'oct. 2022',
    end: 'sept. 2025',
    intro1: 'Responsable de l’UI Kit interne de l’équipe Core Front\u00a0: ',
    introStrong: '118 packages React et TypeScript',
    intro2:
      ' publiés sur un registre NPM privé, consommés par 15 équipes produit et par 47 des 49 applications de la plateforme. Premier contributeur du dépôt (1\u202f040 commits sur 80 contributeurs), auteur de 67 packages.',
    b1: 'Architecture composable\u00a0: monopackage historique éclaté en packages versionnés séparément (Lerna 8, Changesets), Form en 9 packages, Table v2 conçue en 11 packages et 15 fonctionnalités, dont la virtualisation',
    b2: 'Thème personnalisable de l’offre en marque blanche, couleur du texte calculée selon le fond pour garder le contraste\u202f; design tokens des designers (Figma) portés dans le thème (xstyled), aucune valeur brute permise',
    b3: '2\u202f389 versions majeures sur les 293 packages de l’historique\u202f; correction du bug qui ne montait que le patch sur un BREAKING CHANGE, sans signal de rupture pour les 15 équipes',
    b4: 'Composants prêts pour les tests end-to-end de la QA\u00a0: chaque application passe ses test ids selon la page, props unifiées (anciennes dépréciées sans rupture), aucun test id par défaut',
    b5: 'Référent technique de 15 équipes\u00a0: auteur de la documentation et des processus de contribution, 458 merge requests approuvées sur 11 dépôts, pilotage de 5 epics et de 5 études de cadrage',
    proj1Title: 'Refonte de l’outillage, sans rupture pour les équipes consommatrices',
    proj1B1: 'Migration TypeScript intégrale\u00a0: 771 fichiers, plus aucun JavaScript',
    proj1B2:
      'npm vers pnpm, Node 16 vers 22, Jest vers Vitest, Webpack vers tsup et Vite, Lerna 4 vers 8',
    proj1B3:
      'Storybook 5.3 vers 9 (CSF 3, Chromatic, test-runner)\u00a0: 151 stories, changelog de chaque package, badges de dépréciation',
    proj1B4:
      'Temps médian du pipeline de merge request ramené de 17\u00a0min 24\u00a0s à 9\u00a0min (48\u202f% de moins, sur 2\u202f600 jobs)',
    proj1B5:
      '661 tests sur 142 fichiers, 93 des 118 packages avec au moins un test, 33\u00a0secondes d’exécution',
    cvIntro1: 'Responsable de l’UI Kit interne\u00a0: ',
    cvB1: 'Architecture composable\u00a0: monopackage historique éclaté en packages versionnés séparément (Changesets), Table v2 conçue en 11 packages et 15 fonctionnalités, dont la virtualisation',
    cvB2: 'Thème personnalisable de l’offre en marque blanche\u202f; design tokens des designers (Figma) portés dans le thème (xstyled)',
    cvB3: 'Refonte de l’outillage sans rupture pour les équipes consommatrices\u00a0: migration TypeScript intégrale (771 fichiers), npm vers pnpm, Node 16 vers 22, Jest vers Vitest, Webpack vers tsup et Vite',
    cvB4: 'Temps médian du pipeline de merge request ramené de 17\u00a0min 24\u00a0s à 9\u00a0min (48\u202f% de moins, sur 2\u202f600 jobs)\u202f; 661 tests, 93 des 118 packages avec au moins un test',
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
    cvIntro2:
      ', la nouvelle plateforme de Sewan, dès son démarrage\u00a0: 611 commits, 245 tickets livrés et trois applications créées de zéro.',
    cvB1: 'Châssis applicatif des 49 applications du monorepo\u00a0: layout responsive, navigation sur trois niveaux (organisations, sites, comptes)',
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
    cvIntro:
      'Fonctionnalités front et back de trois solutions SaaS, dans une équipe de deux développeurs\u00a0: écrans à partir des maquettes produit, API Node.js et fonctions serverless AWS.',
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
    cvIntro:
      'Participation à la refonte du front-end d’un SI de certification en TypeScript, dans une équipe de sept développeurs.',
  },
  supralogFfbad: {
    title: 'Apprenti développeur full-stack JavaScript (React.js, Redux.js, Next.js, Docker, GCP)',
    start: 'juin 2018',
    end: 'mars 2019',
    proj1Title: 'MyFFBaD\u00a0: espace licencié de la FFBaD',
    proj1State: 'Livré dans les délais',
    proj1Desc1: 'En binôme, développement from scratch des pages front de l’espace licencié de la ',
    proj1Strong: 'Fédération Française de Badminton',
    proj1Desc2:
      ' (190\u202f000 licenciés) à partir des maquettes et du cahier des charges, puis implémentation et déploiement de 3 microservices.',
    cvIntro1: 'En binôme, espace licencié de la ',
    cvIntro2: ' (190\u202f000 licenciés)\u00a0: pages front et 3 microservices déployés.',
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
    cvIntro:
      'Site du Dream Nation Festival 2017, avec réservation (billet et hôtel) et paiement en ligne.',
  },
} as const;
