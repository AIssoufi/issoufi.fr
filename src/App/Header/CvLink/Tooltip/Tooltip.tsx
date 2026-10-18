import { type ReactNode, useId } from 'react';

import { DEFAULT_TOOLTIP_PLACEMENT } from './constants';
import { useTooltip } from './hooks/useTooltip';
import { Bubble, Wrapper } from './Tooltip.styled';
import type { TooltipPlacement } from './types';
import { isTooltipPlacement } from './utils';

/** Props of {@link Tooltip}. Every prop is optional. */
interface TooltipProps {
  /** Text of the tooltip, already translated. Without a text, there is no tooltip. @default '' */
  text?: string;
  /**
   * Side of the trigger on which the tooltip shows, centered on it. An unknown side counts as the
   * default one.
   * @default DEFAULT_TOOLTIP_PLACEMENT
   */
  placement?: TooltipPlacement;
  /**
   * Renders the trigger, a single focusable element such as a link, given the `id` of the tooltip:
   * for its `aria-labelledby` when the tooltip says what the control is, as for the CV link, or
   * its `aria-describedby` when the tooltip adds to its name. The `id` is `undefined` when there
   * is no tooltip. Nothing is rendered in its place when it is not a function.
   */
  children?: (tooltipId: string | undefined) => ReactNode;
}

/**
 * Short text that says what a control does, shown next to it while a mouse or a pen hovers it,
 * and while the keyboard focuses it, but never on a tap (see {@link useTooltip}). `Escape` closes
 * it, and only it. The pointer can move from the control onto the text, which stays open, so it
 * can be read whole even when magnified. Hidden while closed, it stays in the page, so the control
 * can refer to it with `aria-labelledby` or `aria-describedby`: browsers read a hidden element
 * that is referred to, so screen readers read it whether it shows or not.
 *
 * Its element holds the control and the tooltip and adds no space around them: style the control
 * itself, but give it no margin, which would move the tooltip away from it.
 *
 * @example
 * <Tooltip text={t('cvLink.label')} placement="left">
 *   {tooltipId => <a href={getCvUrl(language)} aria-labelledby={tooltipId}>CV</a>}
 * </Tooltip>
 */
const Tooltip = ({ text = '', placement = DEFAULT_TOOLTIP_PLACEMENT, children }: TooltipProps) => {
  const tooltipId = useId();
  const { isOpen, triggerHandlers } = useTooltip();
  const hasText = typeof text === 'string' && text.trim() !== '';
  const shownPlacement = isTooltipPlacement(placement) ? placement : DEFAULT_TOOLTIP_PLACEMENT;
  const describedTooltipId = hasText ? tooltipId : undefined;
  const renderTrigger = typeof children === 'function' ? children : undefined;

  return (
    <Wrapper {...triggerHandlers}>
      {renderTrigger?.(describedTooltipId)}
      {hasText && (
        <Bubble
          id={tooltipId}
          role="tooltip"
          $placement={shownPlacement}
          $isOpen={isOpen}
        >
          {text}
        </Bubble>
      )}
    </Wrapper>
  );
};

export default Tooltip;
