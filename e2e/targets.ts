import type { ScreenPoint } from './utils.ts';

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
 * // [{ name: 'AI', width: 44, height: 54 }, { name: 'FR – Français', width: 44, height: 44 }, …]
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

/** Control of the page, and the points of it that the overlay covers. */
export interface ControlCover {
  /** Name of the control: its `aria-label`, or else its text, without the spaces around it. */
  name: string;
  /** Points of the control where the element on top lies in the overlay, in CSS pixels. */
  coveredPoints: ScreenPoint[];
}

/** Options of {@link listControlCovers}, the argument that `page.evaluate` passes to it. */
export interface ListControlCoversOptions {
  /** Selector of the controls to check, such as `a[href], button`. */
  controlSelector: string;
  /** Selector of the controls left out, such as a skip link. */
  excludedSelector: string;
  /** Selector of the element that must cover no control, such as a sticky header. */
  overlaySelector: string;
  /**
   * Distance from the edges of a control to its corners as checked, in pixels: an element takes
   * no point on its right and bottom edges, so a corner on them would always miss the control.
   */
  edgeInsetPx: number;
}

/**
 * Checks what stands over each control of the page, at its center and its four corners. Each
 * control is first scrolled to the middle of the screen, in its scrolling row too, where it comes
 * under what is fixed on the middle of the screen, as the page can bring it there. A point counts
 * as covered only when the element on top lies in the overlay, not when it merely misses the
 * control: the corners of a round button, or those of a card clipped by its row, show what is
 * behind them. Leaves out the controls of the overlay, those with no width or height, as in a
 * closed menu, and those inside an inert element. Runs in the browser, passed to `page.evaluate`,
 * so it uses nothing from outside its own body.
 *
 * @param options - The argument that `page.evaluate` passes to it.
 * @returns Each control checked, in the order of the page, with its covered points.
 *
 * @example
 * await page.evaluate(listControlCovers, {
 *   controlSelector: 'a[href], button',
 *   excludedSelector: 'a[href="#main"]',
 *   overlaySelector: 'body > header',
 *   edgeInsetPx: 1,
 * });
 * // [{ name: 'Show all (5)', coveredPoints: [{ x: 734, y: 576 }] }, …]
 */
export const listControlCovers = ({
  controlSelector,
  excludedSelector,
  overlaySelector,
  edgeInsetPx,
}: ListControlCoversOptions): ControlCover[] => {
  const overlay = document.querySelector(overlaySelector);
  const isInOverlay = (element: Element) => overlay?.contains(element) ?? false;
  const isChecked = (control: Element) => {
    const { width, height } = control.getBoundingClientRect();
    const hasSize = width > 0 && height > 0;
    const isInert = control.closest('[inert]') !== null;
    return hasSize && !isInert && !control.matches(excludedSelector) && !isInOverlay(control);
  };
  const isCovered = ({ x, y }: ScreenPoint) => {
    const [topElement] = document.elementsFromPoint(x, y);
    return topElement !== undefined && isInOverlay(topElement);
  };

  const check = (control: Element): ControlCover => {
    const name = (control.getAttribute('aria-label') ?? control.textContent ?? '').trim();
    control.scrollIntoView({ block: 'center', inline: 'center' });

    const { left, top, right, bottom, width, height } = control.getBoundingClientRect();
    const [insetLeft, insetRight] = [left + edgeInsetPx, right - edgeInsetPx];
    const [insetTop, insetBottom] = [top + edgeInsetPx, bottom - edgeInsetPx];
    const points = [
      { x: left + width / 2, y: top + height / 2 },
      { x: insetLeft, y: insetTop },
      { x: insetRight, y: insetTop },
      { x: insetLeft, y: insetBottom },
      { x: insetRight, y: insetBottom },
    ];
    return { name, coveredPoints: points.filter(isCovered) };
  };

  return [...document.querySelectorAll(controlSelector)].filter(isChecked).map(check);
};
