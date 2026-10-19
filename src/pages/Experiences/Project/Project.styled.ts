import styled, { th } from '@xstyled/styled-components';

import { MIN_TITLE_WIDTH_PX } from './constants.ts';

export const Container = styled.div`
  margin-top: ${th.space(10)};
`;

/* The state badge wraps under the title when the title would have less than its minimum width
   beside it, as on the narrowest phones. */
export const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${th.space(8)};
  padding: ${th.space(7)} 0;
`;

export const Title = styled.h4`
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('semibold')};
  margin: 0;
  flex: 1 1 ${MIN_TITLE_WIDTH_PX}px;
  line-height: ${th.lineHeight(140)};

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(15)};
  }
`;

export const State = styled.span`
  flex-shrink: 0;
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('semibold')};
  color: ${th.color('success')};
  background: ${th.color('success-a10')};
  border: ${th.borderWidth('thin')} solid ${th.color('success-a20')};
  border-radius: ${th.radius(20)};
  padding: ${th.space(1)} ${th.space(7)};
  white-space: nowrap;

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(14)};
  }
`;

export const Body = styled.div`
  padding-bottom: ${th.space(4)};
`;

export const Description = styled.div`
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('regular')};
  line-height: ${th.lineHeight(155)};
  color: ${th.color('foreground-a72')};

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(15)};
  }
`;
