// @vitest-environment node
import { loadSiteModules } from './site-modules.mjs';

describe('loadSiteModules', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads TypeScript and JSON modules of the site, by group and by name', async () => {
    const modules = await loadSiteModules({
      sources: { pages: '/src/utils/pages.ts' },
      data: { experiences: '/src/pages/Experiences/.data/experiences.json' },
    });

    expect(modules.sources.pages.SITE_URL).toBe('https://issoufi.fr');
    expect(modules.data.experiences.default.experiences.length).toBeGreaterThan(0);
  });

  it('loads nothing when no module is asked for', async () => {
    expect(await loadSiteModules({})).toEqual({});
    expect(await loadSiteModules({ sources: {} })).toEqual({ sources: {} });
  });

  it('fails on a module that does not exist', async () => {
    // Vite logs the error it throws
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(loadSiteModules({ sources: { missing: '/src/missing.ts' } })).rejects.toThrow();
  });
});
