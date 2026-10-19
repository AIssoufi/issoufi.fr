import styled, { th } from '@xstyled/styled-components';

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${th.space(28)};

  @media (min-width: ${th('screens.tablet')}) {
    gap: ${th.space(16)};
  }
`;

export const Link = styled.a`
  display: flex;
  color: ${th.color('foreground-a65')};
  transition: color ${th.duration(250)} ${th.timingFunction('standard')};

  &:hover {
    color: ${th.color('accent-foreground')};
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
  }
`;
