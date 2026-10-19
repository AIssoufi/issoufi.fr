import styled, { css, th } from '@xstyled/styled-components';

import NewTabLink from '../../../../components/NewTabLink/index.ts';
import { HOVER_POINTER_QUERY } from '../../../../theme/constants.ts';
import {
  fingerTarget,
  fingerTargetCenteringOffset,
  fingerTargetSize,
} from '../../../../theme/targets.styled.ts';

/* Space between the icons in the bar of the header on desktop */
const desktopIconGap = th.space(16);

/* Offset of an edge placed in the middle of the gap between the icons of the bar, out of an icon */
const halfDesktopGapOutside = css`calc(${desktopIconGap} / -2)`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${th.space(28)};

  @media (min-width: ${th('screens.tablet')}) {
    gap: ${desktopIconGap};
  }
`;

export const Link = styled(NewTabLink)`
  position: relative;
  display: flex;
  color: ${th.color('foreground-a65')};
  transition: color ${th.duration(250)} ${th.timingFunction('standard')};
  /* Each icon is smaller than a finger target */
  ${fingerTarget}

  @media ${HOVER_POINTER_QUERY} {
    &:hover {
      color: ${th.color('accent-foreground')};
    }
  }

  svg {
    width: auto;
    height: ${th.size(32)};
  }

  /* As high as the text of the links of the bar */
  @media (min-width: ${th('screens.tablet')}) {
    svg {
      height: ${th.size(15)};
    }

    /* Too close to each other for two centered targets: the target of each icon goes from the
       middle of the gap between them outward, over the end of the link next to it, which stays
       wider than a finger target */
    &::after {
      z-index: ${th.zIndex('raised')};
      width: ${fingerTargetSize};
      height: ${fingerTargetSize};
    }

    &:first-child::after {
      inset: ${fingerTargetCenteringOffset} ${halfDesktopGapOutside} auto auto;
    }

    &:last-child::after {
      inset: ${fingerTargetCenteringOffset} auto auto ${halfDesktopGapOutside};
    }
  }
`;
