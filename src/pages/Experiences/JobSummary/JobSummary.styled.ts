import styled, { th } from '@xstyled/styled-components';

export const Summary = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const EntityLogo = styled.img`
  height: ${th.size(54)};
  width: ${th.size(54)};
  object-fit: cover;
  border-radius: ${th.radius('sm')};
  border: ${th.border('card')};
`;

export const JobInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: ${th.space(12)};
`;

export const JobName = styled.h2`
  margin: 0;
  font-size: ${th.fontSize(15)};
  font-weight: ${th.fontWeight('bold')};
  letter-spacing: ${th.letterSpacing(1)};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(17)};
  }
`;

export const RoleName = styled.h3`
  margin: 0;
  font-size: ${th.fontSize(14)};
  font-weight: ${th.fontWeight('semibold')};
  letter-spacing: ${th.letterSpacing(1)};
  line-height: ${th.lineHeight(140)};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(15)};
  }
`;

export const JobDetails = styled.div`
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-secondary')};
  margin-top: ${th.space(2)};
`;

export const JobDuration = styled.div`
  display: inline-flex;
  font-size: ${th.fontSize(11)};
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-secondary')};
  background: ${th.color('foreground-a5')};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a10')};
  border-radius: ${th.radius(20)};
  padding: ${th.space(2)} ${th.space(9)};
  margin-top: ${th.space(4)};
  width: fit-content;
`;
