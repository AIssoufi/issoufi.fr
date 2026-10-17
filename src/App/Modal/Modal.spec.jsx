import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Modal from './Modal';

const addModalRoot = () => {
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root';
  document.body.appendChild(modalRoot);
};

describe('Modal', () => {
  afterEach(() => {
    document.getElementById('modal-root')?.remove();
  });

  it('renders nothing without any props', () => {
    addModalRoot();
    render(<Modal />);

    expect(screen.queryByText("J'ai compris")).not.toBeInTheDocument();
  });

  it('renders nothing when #modal-root is missing', () => {
    render(<Modal displayModal />);

    expect(screen.queryByText("J'ai compris")).not.toBeInTheDocument();
  });

  it('shows the message and calls onClose from both buttons', async () => {
    addModalRoot();
    const onClose = vi.fn();
    render(
      <Modal
        displayModal
        onClose={onClose}
      />,
    );

    expect(screen.getByText(/toujours en développement/)).toBeInTheDocument();
    await userEvent.click(screen.getByText("J'ai compris"));
    await userEvent.click(screen.getByText('×'));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('can be closed without an onClose callback', async () => {
    addModalRoot();
    render(<Modal displayModal />);

    await expect(userEvent.click(screen.getByText("J'ai compris"))).resolves.not.toThrow();
  });
});
