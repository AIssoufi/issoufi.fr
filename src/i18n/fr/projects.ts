/** French texts of the projects page, loaded with its chunk. */
export const frProjects = {
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
} as const;
