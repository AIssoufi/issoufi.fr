import { BottomBar, MiddleBar, TopBar } from './BurgerIcon.styled.ts';

/** Props of {@link BurgerIcon}. */
interface BurgerIconProps {
  /** Whether the mobile menu is open; the bars then show a cross. @default false */
  isOpen?: boolean;
}

/**
 * Icon of the controls of the mobile menu: three bars drawn in CSS, shown with the first render,
 * centered in the positioned control that holds them and drawn in its color. When the menu opens,
 * the outer bars slide onto the middle one, then the bars turn into a cross; when it closes, the
 * cross turns back, then the bars slide apart. An icon of an open menu from its first render shows
 * the cross at once.
 */
const BurgerIcon = ({ isOpen = false }: BurgerIconProps) => (
  <>
    <TopBar $isOpen={isOpen} />
    <MiddleBar $isOpen={isOpen} />
    <BottomBar $isOpen={isOpen} />
  </>
);

export default BurgerIcon;
