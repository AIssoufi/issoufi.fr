import styled, { th } from '@xstyled/styled-components';

import List from '../../../components/List/index.ts';

export const TechList = styled(List)`
  display: flex;
  flex-wrap: wrap;
  gap: ${th.space(6)};
  margin-top: ${th.space(10)};
  /* The height of its chips, wherever it stands in the card */
  line-height: ${th.lineHeight(160)};
`;

export const TechChip = styled.li`
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('medium')};
  border-radius: ${th.radius(20)};
  padding: ${th.space(3)} ${th.space(9)};
  color: ${th.color('foreground-subtle')};
  background: ${th.color('foreground-a4')};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a9')};

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(14)};
  }
`;
