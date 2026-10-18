import { act, render } from '@testing-library/react';

import i18n from '../../../../i18n';
import TextSegments from './TextSegments';

/** Renders the segments in a paragraph, to read the text and the markup they write. */
const renderSegments = segments => render(<TextSegments segments={segments} />).container;

describe('TextSegments', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders nothing without any props', () => {
    expect(renderSegments().innerHTML).toBe('');
  });

  it('renders nothing for an empty list', () => {
    expect(renderSegments([]).innerHTML).toBe('');
  });

  it('writes the pieces one after the other, without a wrapping element', () => {
    const container = renderSegments([
      { key: 'exp.supralog.proj1Desc1' },
      { key: 'exp.supralog.proj1Strong', isStrong: true },
      { key: 'exp.supralog.proj1Desc2' },
    ]);

    expect(container).toHaveTextContent(
      `${i18n.t('exp.supralog.proj1Desc1')}${i18n.t('exp.supralog.proj1Strong')}${i18n.t('exp.supralog.proj1Desc2')}`,
      { normalizeWhitespace: false },
    );
    expect(container.children).toHaveLength(1);
  });

  it('writes the strong pieces in bold, and only them', () => {
    const container = renderSegments([
      { key: 'exp.supralog.proj1Desc1' },
      { key: 'exp.supralog.proj1Strong', isStrong: true },
      { key: 'exp.supralog.proj1Desc2', isStrong: false },
    ]);

    const strongTexts = [...container.querySelectorAll('strong')].map(node => node.textContent);
    expect(strongTexts).toEqual(['Fédération Française de Badminton']);
  });

  it('writes the texts of the active language', async () => {
    const container = renderSegments([{ key: 'exp.supralog.proj1State' }]);

    await act(() => i18n.changeLanguage('en'));

    expect(container).toHaveTextContent(/^Delivered on time$/);
  });

  it.each([
    ['a key without translation', { key: 'exp.unknown' }],
    ['a group of texts', { key: 'exp.sewan', isStrong: true }],
    ['a missing key', {}],
    ['a key that is not a string', { key: 42 }],
  ])('leaves out %s, and keeps the other pieces', (_case, segment) => {
    const container = renderSegments([segment, { key: 'exp.supralog.proj1State' }]);

    expect(container).toHaveTextContent(/^Livré dans les délais$/);
    expect(container.querySelector('strong')).not.toBeInTheDocument();
  });
});
