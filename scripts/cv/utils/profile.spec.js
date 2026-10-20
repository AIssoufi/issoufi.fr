import { buildProfile, buildSkillGroups } from './profile.mjs';

const CODE_URL = 'https://github.com/AIssoufi/issoufi.fr';

describe('buildProfile', () => {
  it('reads the title, the summary, the proof and its links, written without their scheme', () => {
    const texts = {
      profileTitle: 'Summary',
      summary: 'Senior Frontend Engineer',
      proof: 'My site is built by agents',
      proofLinks: [{ label: 'Code', url: CODE_URL }],
    };

    expect(buildProfile(texts)).toEqual({
      title: 'Summary',
      summary: 'Senior Frontend Engineer',
      proof: 'My site is built by agents',
      proofLinks: [{ label: 'Code', text: 'github.com/AIssoufi/issoufi.fr', url: CODE_URL }],
    });
  });

  it('gives empty texts and no link when the data has none', () => {
    expect(buildProfile({})).toEqual({ title: '', summary: '', proof: '', proofLinks: [] });
  });

  it('gives empty texts for values that are not texts', () => {
    const texts = { profileTitle: 42, summary: ['Engineer'], proof: null, proofLinks: 'Code' };

    expect(buildProfile(texts)).toEqual({ title: '', summary: '', proof: '', proofLinks: [] });
  });

  it.each([
    ['without label', { url: CODE_URL }],
    ['with a blank label', { label: '  ', url: CODE_URL }],
    ['without URL', { label: 'Code' }],
    ['with a URL that is not a web address', { label: 'Code', url: 'javascript:alert(1)' }],
    ['with a URL that is not a text', { label: 'Code', url: 42 }],
  ])('leaves out a link %s', (_case, link) => {
    const proofLinks = [link, { label: 'Code', url: CODE_URL }, 'Code', null];

    expect(buildProfile({ proofLinks }).proofLinks).toEqual([
      { label: 'Code', text: 'github.com/AIssoufi/issoufi.fr', url: CODE_URL },
    ]);
  });
});

describe('buildSkillGroups', () => {
  it('keeps each category with its filled skills, in order', () => {
    const skills = [
      { category: 'Frontend', items: ['React.js', '', '  ', 42, 'TypeScript'] },
      { category: 'Backend', items: ['Node.js'] },
    ];

    expect(buildSkillGroups(skills)).toEqual([
      { category: 'Frontend', items: ['React.js', 'TypeScript'] },
      { category: 'Backend', items: ['Node.js'] },
    ]);
  });

  it.each([
    ['without category', { items: ['React.js'] }],
    ['with a blank category', { category: ' ', items: ['React.js'] }],
    ['with a category that is not a text', { category: 42, items: ['React.js'] }],
    ['without skills', { category: 'Frontend' }],
    ['with an empty list of skills', { category: 'Frontend', items: [] }],
    ['with blank skills only', { category: 'Frontend', items: ['', ' '] }],
    ['with skills that are not a list', { category: 'Frontend', items: 'React.js' }],
  ])('leaves out a group %s', (_case, group) => {
    const skills = [group, { category: 'Backend', items: ['Node.js'] }];

    expect(buildSkillGroups(skills)).toEqual([{ category: 'Backend', items: ['Node.js'] }]);
  });

  it.each([undefined, null, 42, 'React.js', { category: 'Frontend', items: ['React.js'] }])(
    'gives no group for %j',
    skills => {
      expect(buildSkillGroups(skills)).toEqual([]);
    },
  );

  it('leaves out the entries that are not objects', () => {
    const skills = ['React.js', null, ['Node.js'], { category: 'Backend', items: ['Node.js'] }];

    expect(buildSkillGroups(skills)).toEqual([{ category: 'Backend', items: ['Node.js'] }]);
  });
});
