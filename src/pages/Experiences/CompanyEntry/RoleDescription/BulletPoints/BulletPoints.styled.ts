import styled, { th } from '@xstyled/styled-components';

import List from '../../../../../components/List';

export const BulletList = styled(List)`
  margin-top: ${th.space(8)};
  display: flex;
  flex-direction: column;
  gap: ${th.space(5)};
`;

export const BulletItem = styled.li`
  position: relative;
  padding-left: ${th.space(16)};
  font-size: ${th.fontSize(14)};
  line-height: ${th.lineHeight(155)};

  /* A decoration: its empty alternative text keeps screen readers from reading the "›". A browser
     without the alternative text drops the second content and keeps the first */
  &::before {
    content: '›';
    content: '›' / '';
    position: absolute;
    left: 0;
    color: ${th.color('accent-soft-a65')};
    font-weight: ${th.fontWeight('bold')};
    font-size: ${th.fontSize(15)};
    line-height: ${th.lineHeight(145)};
  }
`;
