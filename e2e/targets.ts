import type { ScreenPoint } from './utils';

/** Size of the area that catches the taps of a control, as {@link measureHitAreas} measures it. */
export interface HitArea {
  /** Name of the control: its `aria-label`, or else its text, without the spaces around it. */
  name: string;
  /** Width of the area along the horizontal line through the center of the control, in pixels. */
  width: number;
  /** Height of the area along the vertical line through the center of the control, in pixels. */
  height: number;
}

/** Direction in which {@link measureHitAreas} moves away from the center of a control. */
interface ReachStep {
  /** Pixels added to the x of the point at each step: -1 to the left, 1 to the right, 0 neither. */
  stepX: number;
  /** Pixels added to the y of the point at each step: -1 up, 1 down, 0 neither. */
  stepY: number;
}

/** Options of {@link measureHitAreas}, the argument that `page.evaluate` passes to it. */
export interface MeasureHitAreasOptions {
  /** Selector of the controls to measure, such as `a[href], button`. */
  controlSelector: string;
  /**
   * Selector of the controls left out, such as a skip link, which shows only once the keyboard
   * focuses it, which a tap never does.
   */
  excludedSelector: string;
  /**
   * Selector of an element that stays over the page while it scrolls, such as a sticky header:
   * over a control outside it, what it holds does not count, since the page scrolls the control
   * out from under it. The controls inside it are measured as the screen shows them.
   */
  overlaySelector: string;
  /**
   * Distance from the center of a control, in pixels, past which the measure stops on each side:
   * an area wider than twice this size counts as that wide.
   */
  maxReachPx: number;
}

/**
 * Measures the area that catches the taps of each control of the page that the screen shows,
 * with its pseudo-elements and its content: across the horizontal line, then the vertical one,
 * through the center of the control, from the farthest point on one side to the farthest on the
 * other side where the control is the element on top, as for a tap. Each control outside the
 * overlay is first scrolled to the middle of the screen, in its scrolling row too, so that the
 * screen shows the area around it. Leaves out the controls that the screen does not show, those
 * with no width or height, as in a closed menu, and those inside an inert element. Runs in the
 * browser, passed to `page.evaluate`, so it uses nothing from outside its own body.
 *
 * @param options - The argument that `page.evaluate` passes to it.
 * @returns The area of each control, in the order of the page: `0` × `0` for a control covered
 * at its center.
 *
 * @example
 * await page.evaluate(measureHitAreas, {
 *   controlSelector: 'a[href], button',
 *   excludedSelector: 'a[href="#main"]',
 *   overlaySelector: 'body > header',
 *   maxReachPx: 44,
 * });
 * // [{ name: 'AI', width: 44, height: 54 }, { name: 'Français', width: 44, height: 44 }, …]
 */
export const measureHitAreas = ({
  controlSelector,
  excludedSelector,
  overlaySelector,
  maxReachPx,
}: MeasureHitAreasOptions): HitArea[] => {
  const overlay = document.querySelector(overlaySelector);
  const isInOverlay = (element: Element) => overlay?.contains(element) ?? false;
  const hasSize = (control: Element) => {
    const box = control.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  };
  const isMeasured = (control: Element) => {
    const isInert = control.closest('[inert]') !== null;
    return !isInert && !control.matches(excludedSelector) && hasSize(control);
  };

  const measure = (control: Element): HitArea => {
    const name = (control.getAttribute('aria-label') ?? control.textContent ?? '').trim();
    const isPageControl = !isInOverlay(control);
    if (isPageControl) control.scrollIntoView({ block: 'center', inline: 'center' });

    const isControlAt = ({ x, y }: ScreenPoint) => {
      const elements = document.elementsFromPoint(x, y);
      const topElement = isPageControl
        ? elements.find(element => !isInOverlay(element))
        : elements[0];
      return topElement !== undefined && control.contains(topElement);
    };
    const box = control.getBoundingClientRect();
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    // Counts the points, a pixel apart, past the center in one direction, up to the first one
    // where the control is no longer on top
    const reach = ({ stepX, stepY }: ReachStep) => {
      let distance = 0;
      const nextPointHitsControl = () =>
        isControlAt({
          x: center.x + stepX * (distance + 1),
          y: center.y + stepY * (distance + 1),
        });
      while (distance < maxReachPx && nextPointHitsControl()) distance += 1;
      return distance;
    };

    if (!isControlAt(center)) return { name, width: 0, height: 0 };
    const width = reach({ stepX: -1, stepY: 0 }) + 1 + reach({ stepX: 1, stepY: 0 });
    const height = reach({ stepX: 0, stepY: -1 }) + 1 + reach({ stepX: 0, stepY: 1 });
    return { name, width, height };
  };

  return [...document.querySelectorAll(controlSelector)].filter(isMeasured).map(measure);
};
