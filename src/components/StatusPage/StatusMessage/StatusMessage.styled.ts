import styled, { css, th } from '@xstyled/styled-components';

import LocalizedLink from '../../LocalizedLink';
import { HOVER_POINTER_QUERY } from '../../../theme/constants';

export const Container = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${th.space(16)};
  text-align: center;
`;

export const Code = styled.p`
  margin: 0;
  font-size: ${th.fontSize(72)};
  font-weight: ${th.fontWeight('extrabold')};
  line-height: ${th.lineHeight(100)};
  color: ${th.color('accent-foreground')};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(120)};
  }
`;

export const Title = styled.h1`
  margin: 0;
  font-size: ${th.fontSize(26)};
  font-weight: ${th.fontWeight('bold')};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(36)};
  }
`;

export const Message = styled.p`
  margin: 0;
  max-width: ${th.size('message')};
  color: ${th.color('foreground-secondary')};
  line-height: ${th.lineHeight(150)};
  /* A path or a URL quoted in the message has no space to wrap at, and would widen the page */
  overflow-wrap: anywhere;
`;

/* Outlined pill shared by the home link and the action button, so both look the same. */
const pillAction = css`
  margin-top: ${th.space(16)};
  padding: ${th.space(12)} ${th.space(28)};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a40')};
  border-radius: ${th.radius('pill')};
  color: ${th.color('foreground')};
  font-size: ${th.fontSize(14)};
  letter-spacing: ${th.letterSpacing(5)};
  text-transform: uppercase;
  transition-property: border-color, color;
  transition-duration: ${th.duration('base')};

  @media ${HOVER_POINTER_QUERY} {
    &:hover {
      border-color: ${th.color('accent')};
      color: ${th.color('accent-foreground')};
    }
  }
`;

export const HomeLink = styled(LocalizedLink)`
  ${pillAction}
`;

export const ActionButton = styled.button`
  ${pillAction}
  background-color: transparent;
  font-family: inherit;

  @media ${HOVER_POINTER_QUERY} {
    &:hover {
      /* Stays still like the home link, unlike the other buttons of the site */
      transform: none;
    }
  }
`;
