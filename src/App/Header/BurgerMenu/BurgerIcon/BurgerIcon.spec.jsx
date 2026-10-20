import { render } from '@testing-library/react';

import { declaredStyle, serializeCssValue } from '../../../../styleTestUtils.js';
import { theme } from '../../../../theme/index.ts';
import BurgerIcon from './BurgerIcon.tsx';
import { MIDDLE_BAR_OPEN_ROTATION_DEG, TOP_BAR_OPEN_ROTATION_DEG } from './constants.ts';

/**
 * Transitions declared on an element, one per property, as the CSSOM lists them: jsdom joins them
 * with a bare comma, where a browser adds a space.
 */
const transitionsOf = element =>
  declaredStyle({ element, property: 'transition' })
    .split(',')
    .map(transition => transition.trim());

/** Transitions of the bars while the menu opens: they slide together, then turn into a cross. */
const OPENING_TRANSITIONS = [
  `translate ${theme.durations[200]} ${theme.timingFunctions.inOut}`,
  `rotate ${theme.durations[700]} ${theme.timingFunctions.standard} ${theme.durations[200]}`,
  `opacity 0s ${theme.durations[200]}`,
];

/** Transitions of the bars while the menu closes: the cross turns back, then they slide apart. */
const CLOSING_TRANSITIONS = [
  `rotate ${theme.durations[300]} ${theme.timingFunctions.standard}`,
  `translate ${theme.durations[100]} ${theme.timingFunctions.inOut} ${theme.durations[300]}`,
  `opacity 0s ${theme.durations[300]}`,
];

/** Renders the icon in a control, as the burger button and its links hold it. */
const renderIcon = (props = {}) => {
  const { container, rerender } = render(
    <button type="button">
      <BurgerIcon {...props} />
    </button>,
  );
  const getBars = () => [...container.querySelector('button').children];
  const rerenderIcon = nextProps =>
    rerender(
      <button type="button">
        <BurgerIcon {...nextProps} />
      </button>,
    );
  return { getBars, rerenderIcon };
};

describe('BurgerIcon', () => {
  it('draws its three bars without any props, with nothing to load, as for a closed menu', () => {
    const { getBars } = renderIcon();

    expect(getBars()).toHaveLength(3);
    getBars().forEach(bar => {
      expect(bar.tagName).toBe('SPAN');
      expect(declaredStyle({ element: bar, property: 'rotate' })).toBe('');
    });
  });

  it('draws each bar in the size of the icon and in the color of its control', () => {
    const { getBars } = renderIcon();

    getBars().forEach(bar => {
      expect(declaredStyle({ element: bar, property: 'width' })).toBe(theme.sizes['burger-bar']);
      expect(declaredStyle({ element: bar, property: 'height' })).toBe(
        theme.sizes['burger-bar-thickness'],
      );
      expect(declaredStyle({ element: bar, property: 'background' })).toBe(
        serializeCssValue({ property: 'background', value: 'currentColor' }),
      );
      expect(declaredStyle({ element: bar, property: 'border-radius' })).toBe(theme.radii.pill);
    });
  });

  it('centers the bars in their control', () => {
    const { getBars } = renderIcon();

    getBars().forEach(bar => {
      expect(declaredStyle({ element: bar, property: 'position' })).toBe('absolute');
      expect(declaredStyle({ element: bar, property: 'inset' })).toBe(
        serializeCssValue({ property: 'inset', value: '0' }),
      );
      expect(declaredStyle({ element: bar, property: 'margin' })).toBe('auto');
    });
  });

  it('stacks the bars while the menu is closed, the outer ones away from the middle one', () => {
    const { getBars } = renderIcon();
    const [topBar, middleBar, bottomBar] = getBars();
    const gap = theme.space['burger-bar-gap'];

    expect(declaredStyle({ element: topBar, property: 'translate' })).toBe(
      serializeCssValue({ property: 'translate', value: `0 -${gap}` }),
    );
    expect(declaredStyle({ element: middleBar, property: 'translate' })).toBe('');
    expect(declaredStyle({ element: bottomBar, property: 'translate' })).toBe(
      serializeCssValue({ property: 'translate', value: `0 ${gap}` }),
    );
    getBars().forEach(bar => {
      expect(declaredStyle({ element: bar, property: 'rotate' })).toBe('');
      expect(declaredStyle({ element: bar, property: 'opacity' })).toBe('');
    });
  });

  it('turns the top and middle bars into a cross while the menu is open, and hides the bottom one', () => {
    const { getBars } = renderIcon({ isOpen: true });
    const [topBar, middleBar, bottomBar] = getBars();

    expect(declaredStyle({ element: topBar, property: 'translate' })).toBe('none');
    expect(declaredStyle({ element: topBar, property: 'rotate' })).toBe(
      `${TOP_BAR_OPEN_ROTATION_DEG}deg`,
    );
    expect(declaredStyle({ element: middleBar, property: 'rotate' })).toBe(
      `${MIDDLE_BAR_OPEN_ROTATION_DEG}deg`,
    );
    expect(declaredStyle({ element: bottomBar, property: 'translate' })).toBe('none');
    expect(declaredStyle({ element: bottomBar, property: 'opacity' })).toBe('0');
  });

  it('slides the bars together before turning them into a cross when the menu opens', () => {
    const { getBars, rerenderIcon } = renderIcon();

    rerenderIcon({ isOpen: true });

    getBars().forEach(bar => expect(transitionsOf(bar)).toEqual(OPENING_TRANSITIONS));
  });

  it('turns the cross back before sliding the bars apart when the menu closes', () => {
    const { getBars, rerenderIcon } = renderIcon({ isOpen: true });

    rerenderIcon({ isOpen: false });

    getBars().forEach(bar => expect(transitionsOf(bar)).toEqual(CLOSING_TRANSITIONS));
    expect(declaredStyle({ element: getBars()[0], property: 'rotate' })).toBe('');
  });

  it('keeps the bars of a closed menu when isOpen is missing', () => {
    const { getBars } = renderIcon({ isOpen: undefined });

    expect(declaredStyle({ element: getBars()[0], property: 'rotate' })).toBe('');
  });
});
