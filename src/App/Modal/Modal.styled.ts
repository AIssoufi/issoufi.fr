import styled, { th } from '@xstyled/styled-components';

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${th.color('shade-a85')};
`;

export const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  background-color: ${th.color('surface')};
  border-radius: ${th.radius('md')};
  padding: ${th.space(10)};
  margin: ${th.space(7)};
`;

export const ModalHeader = styled.header`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const CloseButton = styled.button`
  color: white;
  background-color: transparent;
  border-radius: ${th.radius('pill')};
  border-width: 1px;
  border-style: solid;
  width: max-content;
  height: max-content;
`;

export const ModalBody = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${th.space(24)};

  p {
    margin: 0 0 ${th.space(20)} 0;
    text-align: center;
  }
`;

export const ConfirmButton = styled.button`
  color: ${th.color('foreground')};
  background-color: ${th.color('accent')};
  border-color: ${th.color('accent')};
  padding: ${th.space(10)} ${th.space(20)};
  border-radius: ${th.radius('pill')};
  border-width: 1px;
  border-style: solid;
  width: max-content;
  transform: scale(1);
  transition-property: color, border-color, transform, background-color;
  transition-duration: ${th.duration('base')};

  &:hover {
    cursor: pointer;
    transform: scale(1.15);
  }
`;
