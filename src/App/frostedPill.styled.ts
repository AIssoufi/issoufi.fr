import { css, th } from '@xstyled/styled-components';

/* Frosted glass pill of the floating controls, the language toggle (Header/LangToggle) and the
   site badge (SiteBadge), so that both look alike: a translucent dark fill over a blurred
   background, which keeps them readable over any content, and an accent halo on hover. Each
   control sets its own position, layout and padding. */
export const frostedPill = css`
  border-radius: ${th.radius(30)};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a10')};
  background: ${th.color('shade-a35')};
  backdrop-filter: ${th('blurs.14')};
  -webkit-backdrop-filter: ${th('blurs.14')};
  box-shadow: ${th.shadow('card')};
  transition:
    box-shadow ${th.duration(300)} ${th.timingFunction('standard')},
    border-color ${th.duration(300)} ${th.timingFunction('standard')};

  &:hover {
    border-color: ${th.color('accent-a40')};
    box-shadow: ${th.shadow('accentHalo')};
  }
`;
