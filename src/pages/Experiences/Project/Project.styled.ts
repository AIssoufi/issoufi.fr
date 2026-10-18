import styled, { th } from '@xstyled/styled-components';

export const Container = styled.div`
  margin-top: ${th.space(10)};
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: ${th.space(8)};
  padding: ${th.space(7)} 0;
`;

export const Title = styled.h4`
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('semibold')};
  margin: 0;
  flex: 1;
  line-height: ${th.lineHeight(140)};
`;

export const State = styled.span`
  flex-shrink: 0;
  font-size: ${th.fontSize(10)};
  font-weight: ${th.fontWeight('semibold')};
  color: ${th.color('success')};
  background: ${th.color('success-a10')};
  border: ${th.borderWidth('thin')} solid ${th.color('success-a20')};
  border-radius: ${th.radius(20)};
  padding: ${th.space(1)} ${th.space(7)};
  white-space: nowrap;
`;

export const Body = styled.div`
  padding-bottom: ${th.space(4)};
`;

export const Description = styled.div`
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('regular')};
  line-height: ${th.lineHeight(155)};
  color: ${th.color('foreground-a72')};
`;
