import styled, { css, keyframes } from 'styled-components';

const heartPop = keyframes`
  0%   { transform: scale(1); }
  25%  { transform: scale(1.7); }
  50%  { transform: scale(0.8); }
  75%  { transform: scale(1.3); }
  100% { transform: scale(1); }
`;

const countBump = keyframes`
  0%   { transform: translateY(0); opacity: 1; }
  40%  { transform: translateY(-6px); opacity: 0; }
  41%  { transform: translateY(6px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

export const Section = styled.section`
  height: max-content;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
`;

export const SectionHeader = styled.header`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 10px;
  padding-left: var(--page-padding);
  padding-right: var(--page-padding);

  @media (min-width: 50em) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-left: 0;
    padding-right: 0;
  }
`;

export const SectionTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  margin: 0;
  margin-bottom: 10px;
  letter-spacing: -0.01em;

  @media (min-width: 50em) {
    font-size: 40px;
  }
`;

export const NavCtrl = styled.nav`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const CtrlItem = styled.button`
  order: 3;
  height: 32px;
  border-radius: 60px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.03em;
  white-space: nowrap;
  color: var(--primary-color);
  background-color: var(--transparent-bg-color);
  border: var(--card-border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition-property: background-color, border-color, color;
  transition-duration: var(--transition-duration);

  &:hover {
    background-color: var(--tertiary-color);
    border-color: var(--tertiary-color);
    color: var(--primary-color);
    cursor: pointer;
    transform: none;
  }
`;

export const IconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: var(--card-border);
  border-radius: 50%;
  color: var(--primary-color);
  background-color: var(--transparent-bg-color);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition-property: background-color, border-color;
  transition-duration: var(--transition-duration);
  flex-shrink: 0;
  cursor: pointer;

  > svg {
    width: 16px;
    height: 16px;
    display: block;
  }

  &:hover {
    background-color: var(--tertiary-color);
    border-color: var(--tertiary-color);
    transform: none;
  }
`;

export const ProjectGrid = styled.main<{ $displayAll: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 100vw;
  white-space: nowrap;
  overflow-x: auto;

  ${props =>
    props.$displayAll &&
    `
    display: grid;
    grid-template-columns: repeat(1, minmax(min-content, 1fr));
    grid-auto-flow: row;
    row-gap: 5px;

    @media (min-width: 50em) {
      grid-template-columns: repeat(2, minmax(min-content, 1fr));
    }

    @media (min-width: 100em) {
      grid-template-columns: repeat(3, minmax(min-content, 1fr));
    }
  `}
`;

export const ProjectItem = styled.div<{ $displayAll?: boolean }>`
  display: flex;
  flex-direction: column;
  margin: 5px;
  flex: 0 0 calc(33.333% - 10px);
  min-width: 260px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  will-change: transform;
  transform-style: preserve-3d;

  &:not(:hover) {
    transform: perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px);
    transition: transform 0.4s ease;
  }

  &:first-child {
    padding-left: ${props => (props.$displayAll ? '0' : 'var(--page-padding)')};
  }

  &:last-child {
    padding-right: ${props => (props.$displayAll ? '0' : 'var(--page-padding)')};
  }

  @media (min-width: 50em) {
    flex: ${props => (props.$displayAll ? '1 1 auto' : '0 0 calc(33.333% - 10px)')};
    min-width: ${props => (props.$displayAll ? 'unset' : '260px')};

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }
  }
`;

export const ImageContainer = styled.header`
  height: 220px;
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);

  &::before {
    content: '';
    position: absolute;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.35) 0%,
      rgba(0, 0, 0, 0) 50%,
      rgba(0, 0, 0, 0.5) 100%
    );
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(255, 255, 255, 0.18) 0%,
      rgba(255, 255, 255, 0.06) 30%,
      transparent 65%
    );
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 2;
    pointer-events: none;
  }

  ${ProjectItem}:hover &::after {
    opacity: 1;
  }
`;

export const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  transition-property: object-position;
  transition-duration: var(--transition-duration);

  ${ProjectItem}:hover & {
    object-position: center;
  }
`;

export const LikeButton = styled.button<{ $liked: boolean; $animating: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px 5px 8px;
  border-radius: 60px;
  border: 1px solid ${props => (props.$liked ? 'rgba(139,49,104,0.6)' : 'rgba(255,255,255,0.2)')};
  background: ${props => (props.$liked ? 'rgba(139,49,104,0.25)' : 'rgba(0,0,0,0.45)')};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s,
    transform 0.15s;

  > svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    stroke: ${props => (props.$liked ? 'var(--tertiary-color)' : 'rgba(255,255,255,0.85)')};
    fill: ${props => (props.$liked ? 'var(--tertiary-color)' : 'transparent')};
    transition:
      stroke 0.2s,
      fill 0.2s;
    ${props =>
      props.$animating &&
      css`
        animation: ${heartPop} 0.45s ease forwards;
      `}
  }

  &:hover {
    border-color: rgba(139, 49, 104, 0.7);
    background: rgba(139, 49, 104, 0.2);
    transform: scale(1.06);

    > svg {
      stroke: var(--tertiary-color);
    }
  }

  &:active {
    transform: scale(0.93);
  }

  &:hover {
    transform: scale(1.06);
  }
`;

export const LikeCount = styled.span<{ $liked: boolean; $animating: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${props => (props.$liked ? 'var(--tertiary-color)' : 'rgba(255,255,255,0.85)')};
  transition: color 0.2s;
  min-width: 12px;
  text-align: center;
  ${props =>
    props.$animating &&
    css`
      animation: ${countBump} 0.35s ease forwards;
    `}
`;

export const ProjectInfo = styled.main`
  margin-top: 10px;
  padding-left: 4px;
`;

export const ProjectName = styled.div`
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.01em;
  margin-bottom: 3px;
`;

export const ProjectType = styled.div`
  font-size: 13px;
  color: var(--secondary-dark-color);
`;

export const ProjectTools = styled.div`
  font-size: 13px;
  color: var(--secondary-dark-color);
`;
