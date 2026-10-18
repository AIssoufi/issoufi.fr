import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { theme } from '../../../../theme';
import { declaredStyle, serializeCssValue } from '../../../../styleTestUtils';
import Tooltip from './Tooltip';

const TEXT = 'Télécharger le CV';

/**
 * Renders a tooltip around a link, the way the CV link uses it, then a button to move the focus to.
 */
const renderTooltip = props =>
  render(
    <>
      <Tooltip
        text={TEXT}
        {...props}
      >
        {tooltipId => (
          <a
            href="#cv"
            aria-describedby={tooltipId}
          >
            CV
          </a>
        )}
      </Tooltip>
      <button type="button">After</button>
    </>,
  );

const getTrigger = () => screen.getByRole('link', { name: 'CV' });

/** The tooltip, found even while it is hidden. */
const getTooltip = () => screen.getByRole('tooltip', { hidden: true });

/** The gap between the trigger and the tooltip, as the CSSOM serializes it in a `calc()`. */
const offsetFromTrigger = property =>
  serializeCssValue({ property, value: `calc(100% + ${theme.space['tooltip-gap']})` });

describe('Tooltip', () => {
  it('renders nothing visible without any props', () => {
    const { container } = render(<Tooltip />);

    expect(container.firstChild).toBeEmptyDOMElement();
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });

  it('describes its trigger with its text, even while it is hidden', () => {
    renderTooltip();

    expect(getTooltip()).toHaveTextContent(TEXT);
    expect(getTooltip()).not.toBeVisible();
    expect(getTrigger()).toHaveAttribute('aria-describedby', getTooltip().id);
    expect(getTrigger()).toHaveAccessibleDescription(TEXT);
  });

  it('can name its trigger instead, even while it is hidden', () => {
    render(
      <Tooltip text={TEXT}>
        {tooltipId => (
          <a
            href="#cv"
            aria-labelledby={tooltipId}
          >
            CV
          </a>
        )}
      </Tooltip>,
    );

    expect(getTooltip()).not.toBeVisible();
    expect(screen.getByRole('link')).toHaveAccessibleName(TEXT);
  });

  it('gives each tooltip an id of its own', () => {
    render(
      <>
        <Tooltip text="First">
          {tooltipId => (
            <a
              href="#first"
              aria-describedby={tooltipId}
            >
              1
            </a>
          )}
        </Tooltip>
        <Tooltip text="Second">
          {tooltipId => (
            <a
              href="#second"
              aria-describedby={tooltipId}
            >
              2
            </a>
          )}
        </Tooltip>
      </>,
    );

    expect(screen.getByRole('link', { name: '1' })).toHaveAccessibleDescription('First');
    expect(screen.getByRole('link', { name: '2' })).toHaveAccessibleDescription('Second');
  });

  describe('hover', () => {
    it('shows while the mouse hovers the trigger, and hides once it leaves', async () => {
      renderTooltip();

      await userEvent.hover(getTrigger());
      expect(getTooltip()).toBeVisible();

      await userEvent.unhover(getTrigger());
      expect(getTooltip()).not.toBeVisible();
    });

    it('stays open while the pointer moves from the trigger onto the tooltip', async () => {
      renderTooltip();

      await userEvent.hover(getTrigger());
      await userEvent.hover(getTooltip());

      expect(getTooltip()).toBeVisible();
    });

    it('does not show on a tap', () => {
      renderTooltip();

      fireEvent.pointerEnter(getTrigger(), { pointerType: 'touch' });
      fireEvent.focus(getTrigger());

      expect(getTooltip()).not.toBeVisible();
    });
  });

  describe('keyboard', () => {
    it('shows while the keyboard focuses the trigger, and hides once the focus leaves', async () => {
      renderTooltip();

      await userEvent.tab();
      expect(getTrigger()).toHaveFocus();
      expect(getTooltip()).toBeVisible();

      await userEvent.tab();
      expect(getTooltip()).not.toBeVisible();
    });

    it('shows on each trigger that Tab reaches, one after the other', async () => {
      render(
        <>
          {['First', 'Second'].map(name => (
            <Tooltip
              key={name}
              text={`${name} tooltip`}
            >
              {tooltipId => (
                <a
                  href={`#${name}`}
                  aria-describedby={tooltipId}
                >
                  {name}
                </a>
              )}
            </Tooltip>
          ))}
        </>,
      );

      await userEvent.tab();
      expect(screen.getByText('First tooltip')).toBeVisible();

      await userEvent.tab();
      expect(screen.getByText('First tooltip')).not.toBeVisible();
      expect(screen.getByText('Second tooltip')).toBeVisible();
    });

    it('hides once the mouse leaves when a click focused the trigger', async () => {
      renderTooltip();

      await userEvent.click(getTrigger());
      expect(getTooltip()).toBeVisible();

      await userEvent.unhover(getTrigger());
      expect(getTrigger()).toHaveFocus();
      expect(getTooltip()).not.toBeVisible();
    });
  });

  describe('Escape', () => {
    it('hides the tooltip opened by the keyboard, which shows again on the next focus', async () => {
      renderTooltip();
      await userEvent.tab();

      await userEvent.keyboard('{Escape}');
      expect(getTrigger()).toHaveFocus();
      expect(getTooltip()).not.toBeVisible();

      await userEvent.tab();
      await userEvent.tab({ shift: true });
      expect(getTooltip()).toBeVisible();
    });

    it('hides the tooltip opened by the mouse, wherever the focus is', async () => {
      renderTooltip();
      screen.getByRole('button', { name: 'After' }).focus();
      await userEvent.hover(getTrigger());

      await userEvent.keyboard('{Escape}');

      expect(getTooltip()).not.toBeVisible();
    });
  });

  describe('text', () => {
    it.each([
      ['empty', ''],
      ['made of spaces', '   '],
      ['not a string', 42],
      ['null', null],
    ])('renders no tooltip and describes nothing when the text is %s', (_case, text) => {
      renderTooltip({ text });

      expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
      expect(getTrigger()).not.toHaveAttribute('aria-describedby');
    });

    it('escapes the markup of its text', () => {
      renderTooltip({ text: '<b>CV</b> & PDF' });
      expect(getTooltip()).toHaveTextContent('<b>CV</b> & PDF');
      expect(getTooltip().querySelector('b')).not.toBeInTheDocument();
    });
  });

  it.each([
    ['a string', 'CV'],
    ['undefined', undefined],
  ])('renders only the tooltip when the children are %s', (_case, children) => {
    render(<Tooltip text={TEXT}>{children}</Tooltip>);

    expect(getTooltip().parentElement.childNodes).toHaveLength(1);
  });

  describe('placement', () => {
    it('shows above the trigger by default, centered on it', () => {
      renderTooltip();

      const style = property => declaredStyle({ element: getTooltip(), property });
      expect(style('bottom')).toBe(offsetFromTrigger('bottom'));
      expect(style('left')).toBe('50%');
      expect(style('transform')).toBe('translateX(-50%)');
      expect(style('right')).toBe('');
    });

    it('shows on the left of the trigger, centered on it', () => {
      renderTooltip({ placement: 'left' });

      const style = property => declaredStyle({ element: getTooltip(), property });
      expect(style('right')).toBe(offsetFromTrigger('right'));
      expect(style('top')).toBe('50%');
      expect(style('transform')).toBe('translateY(-50%)');
      expect(style('bottom')).toBe('');
    });

    it.each([
      ['unknown', 'right'],
      ['empty', ''],
      ['not a string', 1],
    ])('shows above the trigger when the placement is %s', (_case, placement) => {
      renderTooltip({ placement });

      expect(declaredStyle({ element: getTooltip(), property: 'bottom' })).toBe(
        offsetFromTrigger('bottom'),
      );
    });

    it.each([
      ['left', 'width', { left: '100%', top: '0px', bottom: '0px' }],
      ['top', 'height', { top: '100%', left: '0px', right: '0px' }],
    ])(
      'bridges the gap to the trigger on the %s, so the pointer can reach the tooltip',
      (placement, side, position) => {
        renderTooltip({ placement });

        const bridgeStyle = property =>
          declaredStyle({ element: getTooltip(), property, pseudo: '::before' });
        expect(bridgeStyle('content')).toBe('""');
        expect(bridgeStyle('position')).toBe('absolute');
        expect(bridgeStyle(side)).toBe(theme.space['tooltip-gap']);
        for (const [property, value] of Object.entries(position)) {
          expect(bridgeStyle(property)).toBe(value);
        }
      },
    );
  });

  it('draws a small dark bubble that keeps its text on one line', () => {
    renderTooltip();

    const style = getComputedStyle(getTooltip());
    expect(style.position).toBe('absolute');
    expect(style.whiteSpace).toBe('nowrap');
    expect(style.fontSize).toBe(theme.fontSizes[13]);
    expect(style.color).toBe(
      serializeCssValue({ property: 'color', value: theme.colors.foreground }),
    );
    expect(style.backgroundColor).toBe(
      serializeCssValue({ property: 'background-color', value: theme.colors['shade-a80'] }),
    );
  });
});
