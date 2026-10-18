import type { ComponentPropsWithRef } from 'react';

/**
 * Props of {@link List}: every attribute of a `<ul>` and its `ref`, except `role`, which List
 * always sets. A `role` passed anyway, from JavaScript, is ignored.
 */
type ListProps = Omit<ComponentPropsWithRef<'ul'>, 'role'>;

/**
 * List of the site, rendered as a `<ul>` that always has `role="list"`. The global style removes
 * the bullets of every `<ul>`, and Safari then stops exposing it as a list, so VoiceOver no longer
 * announces it or counts its items: the explicit role keeps both. Every list of the site uses it,
 * extended with `styled(List)` in its component's style file, with `<li>` items. The role is set
 * after the other props rather than with `attrs`, which styled-components skips for a prop passed
 * as `undefined`.
 *
 * @example
 * const NavList = styled(List)`
 *   display: flex;
 * `;
 *
 * <NavList>
 *   <li>…</li>
 * </NavList>
 */
const List = (props: ListProps) => (
  <ul
    {...props}
    role="list"
  />
);

export default List;
