import styled, { th } from '@xstyled/styled-components';

export const Link = styled.a`
  display: flex;
  color: ${th.color('foreground-a65')};
  transition: color ${th.duration(250)} ${th.timingFunction('standard')};

  &:hover {
    color: ${th.color('accent')};
  }

  svg {
    width: auto;
    height: ${th.size(32)};
  }
`;
