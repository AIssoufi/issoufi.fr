import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const Container = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 60vh;
  text-align: center;
`;

export const Code = styled.p`
  margin: 0;
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  color: var(--tertiary-color);

  @media (min-width: 50em) {
    font-size: 120px;
  }
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 26px;
  font-weight: 700;

  @media (min-width: 50em) {
    font-size: 36px;
  }
`;

export const Message = styled.p`
  margin: 0;
  max-width: 40ch;
  color: var(--secondary-color);
  line-height: 1.5;
`;

export const HomeLink = styled(Link)`
  margin-top: 16px;
  padding: 12px 28px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 60px;
  color: var(--primary-color);
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition-property: border-color, color;
  transition-duration: var(--transition-duration);

  &:hover {
    border-color: var(--tertiary-color);
    color: var(--tertiary-color);
  }
`;
