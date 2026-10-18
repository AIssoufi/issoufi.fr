import styled, { keyframes, th } from '@xstyled/styled-components';

const textFlow = keyframes`
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
`;

export const StrongWord = styled.span<{ $delay: string; $reverse: boolean }>`
  display: inline-block;
  will-change: transform;
  font-size: ${th.fontSize(28)};
  font-weight: ${th.fontWeight('bold')};
  letter-spacing: ${th.letterSpacing('tight')};
  background: linear-gradient(
    90deg,
    ${th.color('foreground')} 0%,
    ${th.color('foreground')} 30%,
    ${th.color('accent-soft')} 50%,
    ${th.color('foreground')} 70%,
    ${th.color('foreground')} 100%
  );
  background-size: 300% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${textFlow} ${th.duration(5000)} ${th.timingFunction('linear')} infinite;
  animation-delay: ${({ $delay }) => $delay};
  animation-direction: ${({ $reverse }) => ($reverse ? 'reverse' : 'normal')};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(42)};
  }
`;
