import styled from 'styled-components';

export const Container = styled.div`
  margin-top: 10px;
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
`;

export const Toggle = styled.span`
  flex-shrink: 0;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1;
`;

export const Title = styled.h3`
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  line-height: 1.4;
  transition: color 0.15s;
`;

export const State = styled.span`
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  color: rgba(130, 210, 150, 0.85);
  background: rgba(50, 180, 100, 0.1);
  border: 1px solid rgba(50, 180, 100, 0.2);
  border-radius: 20px;
  padding: 1px 7px;
  white-space: nowrap;
`;

export const Body = styled.div`
  padding-bottom: 4px;
`;

export const Descriptiopn = styled.main`
  font-size: 13px;
  font-weight: 400;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.72);
`;
