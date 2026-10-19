import styled, { th } from '@xstyled/styled-components';

import Technologies from '../Technologies';
import { card, cardColumns, cardDetails, cardTechnologies } from '../timeline.styled';

export const Article = styled.article`
  ${card}
  ${cardColumns}
  padding: ${th.space(16)};
`;

export const Details = styled.div`
  font-size: ${th.fontSize(14)};
  font-weight: ${th.fontWeight('regular')};
  margin-top: ${th.space(12)};
  position: relative;
  line-height: ${th.lineHeight(160)};
  ${cardDetails}
`;

export const JobTechnologies = styled(Technologies)`
  ${cardTechnologies}
`;
