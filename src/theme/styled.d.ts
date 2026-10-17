import '@xstyled/system';
import 'styled-components';

import type { theme } from './theme';

type AppTheme = typeof theme;

declare module '@xstyled/system' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends AppTheme {}
}

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends AppTheme {}
}
