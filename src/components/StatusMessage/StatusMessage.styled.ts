import { Link } from 'react-router';
import styled, { th } from '@xstyled/styled-components';

export const Container = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${th.space(16)};
  min-height: 60vh;
  text-align: center;
`;

export const Code = styled.p`
  margin: 0;
  font-size: ${th.fontSize(72)};
  font-weight: ${th.fontWeight('extrabold')};
  line-height: ${th.lineHeight(100)};
  color: ${th.color('accent')};

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
  max-width: 40ch;
  color: ${th.color('foreground-secondary')};
  line-height: ${th.lineHeight(150)};
`;

export const HomeLink = styled(Link)`
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

  &:hover {
    border-color: ${th.color('accent')};
    color: ${th.color('accent')};
  }
`;
