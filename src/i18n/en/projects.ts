import type { Translations } from '../types.ts';

/** English texts of the projects page, loaded with its chunk. */
export const enProjects = {
  pageTitle: 'Projects',
  personal: 'Personal projects',
  freelance: 'Freelance projects',
  showLess: 'Show less',
  showAll: 'Show all ({{count}})',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageStatus_one: 'Project {{first}} of {{total}}',
  pageStatus_other: 'Projects {{first}} to {{last}} of {{total}}',
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
} as const satisfies Translations['projects'];
