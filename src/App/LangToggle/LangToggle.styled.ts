import styled, { th } from '@xstyled/styled-components';

export const Wrapper = styled.div`
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: ${th.zIndex('overlay')};
  display: flex;
  flex-direction: column;
  padding: ${th.space(4)};
  gap: ${th.space(4)};
  border-radius: ${th.radius(30)};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a10')};
  background: ${th.color('shade-a35')};
  backdrop-filter: ${th('blurs.14')};
  -webkit-backdrop-filter: ${th('blurs.14')};
  box-shadow: ${th.shadow('card')};
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease;

  &:hover {
    border-color: ${th.color('accent-a40')};
    box-shadow: ${th.shadow('accentHalo')};
  }
`;

export const Indicator = styled.div<{ $index: number }>`
  position: absolute;
  left: 4px;
  right: 4px;
  height: 32px;
  border-radius: ${th.radius(24)};
  background: ${th.color('accent-a35')};
  border: ${th.borderWidth('thin')} solid ${th.color('accent-a55')};
  box-shadow: ${th.shadow('accentGlowFaint')};
  transform: translateY(${({ $index }) => $index * 36}px);
  transition: transform ${th.duration(350)} ${th.timingFunction('spring')};
  pointer-events: none;
`;

export const Btn = styled.button<{ $active: boolean }>`
  position: relative;
  z-index: ${th.zIndex('raised')};
  background: none;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 32px;
  border-radius: ${th.radius(24)};
  font-size: ${th.fontSize(11)};
  font-weight: ${th.fontWeight('bold')};
  letter-spacing: ${th.letterSpacing(8)};
  color: ${({ $active }) => ($active ? th.color('accent-soft') : th.color('foreground-a35'))};
  transition: color ${th.duration(250)} ${th.timingFunction('standard')};

  &:hover {
    color: ${({ $active }) => ($active ? th.color('accent-soft') : th.color('foreground-a70'))};
  }
`;
