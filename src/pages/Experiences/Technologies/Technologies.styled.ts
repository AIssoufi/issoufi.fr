import styled from 'styled-components';

import { th } from '@xstyled/styled-components';

export const TechList = styled.footer`
  display: flex;
  flex-wrap: wrap;
  gap: ${th.space(6)};
  margin-top: ${th.space(10)};
`;

export const TechChip = styled.span`
  font-size: ${th.fontSize(11)};
  font-weight: ${th.fontWeight('medium')};
  border-radius: ${th.radius(20)};
  padding: ${th.space(3)} ${th.space(9)};
  color: ${th.color('foreground-subtle')};
  background: ${th.color('foreground-a4')};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a9')};
`;
