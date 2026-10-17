import { createPortal } from 'react-dom';

import {
  CloseButton,
  ConfirmButton,
  Container,
  ModalBody,
  ModalHeader,
  Overlay,
} from './Modal.styled';

/** Props of {@link Modal}. */
interface ModalProps {
  /** Whether the modal is shown. @default false */
  displayModal?: boolean;
  /** Called when the close button or the confirm button is clicked. */
  onClose?: () => void;
}

/**
 * Information modal telling visitors that the site is still under construction, with a close
 * button and an "I understand" button. Rendered in a portal into the `#modal-root` element;
 * renders nothing when that element is missing from the page. Not used by the app at the moment.
 */
const Modal = ({ displayModal = false, onClose }: ModalProps) => {
  const modalRoot = document.getElementById('modal-root');
  if (!displayModal || !modalRoot) return null;

  return createPortal(
    <Overlay>
      <Container>
        <ModalHeader>
          <CloseButton onClick={() => onClose?.()}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <p>Ce site est toujours en développement et sera bientôt terminé !</p>
          <ConfirmButton
            type="button"
            onClick={() => onClose?.()}
          >
            J'ai compris
          </ConfirmButton>
        </ModalBody>
      </Container>
    </Overlay>,
    modalRoot,
  );
};

export default Modal;
