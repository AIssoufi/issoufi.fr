import styled, { css, keyframes } from 'styled-components';

const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Nav = styled.nav<{ $mobileMenuIsOpen: boolean }>`
  display: none;

  ${props =>
    props.$mobileMenuIsOpen &&
    css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: fixed;
      inset: 0;
      z-index: 9;
      background: rgba(10, 6, 18, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    `}

  @media (min-width: 50em) {
    display: flex;
    flex-direction: row;
    align-items: center;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    position: static;
    z-index: auto;
  }
`;

export const NavList = styled.ul`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  @media (min-width: 50em) {
    flex-direction: row;
    align-items: center;
    gap: 0;
  }
`;

export const NavItem = styled.li`
  padding: 16px 48px;
  font-size: 28px;
  font-weight: 300;
  letter-spacing: 0.06em;
  animation: ${fadeSlideIn} 0.3s ease both;
  border-radius: 12px;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:active a {
    color: var(--tertiary-color);
  }

  &:active {
    background: rgba(139, 49, 104, 0.15);
  }

  @media (min-width: 50em) {
    padding: 10px 16px;
    font-size: 15px;
    font-weight: 400;
    letter-spacing: 0.03em;
    animation: none;
    border-radius: 0;
    position: relative;
    transform: scale(1);
    transition-property: transform, color;
    transition-duration: var(--transition-duration);

    &:hover {
      transform: scale(1.06);
      background: transparent;
    }

    &:hover a {
      color: var(--tertiary-color);
    }

    &:active {
      background: transparent;
    }

    > a::before {
      content: '';
      position: absolute;
      height: 2px;
      background-color: var(--tertiary-color);
      bottom: 4px;
      left: 16px;
      right: 16px;
      display: none;
      border-radius: 2px;
    }

    > a.active::before {
      display: block;
    }

    > a.active {
      color: var(--tertiary-color);
      font-weight: 600;
    }
  }
`;

export const CtaButton = styled.a`
  border-radius: 60px;
  width: max-content;
  transform: scale(1);
  transition-property: color, border-color, transform, background-color, box-shadow;
  transition-duration: var(--transition-duration);
  margin-top: 28px;
  padding: 14px 36px;
  color: var(--primary-color);
  background-color: transparent;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  height: max-content;
  font-size: 18px;
  letter-spacing: 0.06em;
  animation: ${fadeSlideIn} 0.3s ease 0.2s both;

  &:active {
    background-color: rgba(139, 49, 104, 0.2);
    border-color: rgba(139, 49, 104, 0.6);
  }

  .icon {
    margin-right: 0.7em;
  }

  .text {
    text-transform: uppercase;
  }

  @media (min-width: 50em) {
    margin-top: 0;
    margin-left: 8px;
    padding: 8px 22px;
    font-size: 14px;
    letter-spacing: 0.04em;
    animation: none;

    &:hover {
      transform: scale(1.06);
      color: var(--tertiary-color);
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      box-shadow: 0 0 16px rgba(139, 49, 104, 0.3);
    }

    &:hover .icon {
      stroke: var(--tertiary-color);
    }

    &:active {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }
  }
`;
