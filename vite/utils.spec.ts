import { DEFAULT_DEV_PORT, DEFAULT_PREVIEW_PORT, MAX_PORT, MIN_PORT } from './constants';
import { getServerPorts, parsePort } from './utils';

describe('parsePort', () => {
  it.each([
    ['12345', 12345],
    ['3000', 3000],
    ['10000', 10000],
    ['19999', 19999],
  ])('reads the port %j', (value, expected) => {
    expect(parsePort(value)).toBe(expected);
  });

  it('accepts the lowest and the highest port', () => {
    expect(parsePort(String(MIN_PORT))).toBe(MIN_PORT);
    expect(parsePort(String(MAX_PORT))).toBe(MAX_PORT);
  });

  it('ignores surrounding spaces and leading zeros', () => {
    expect(parsePort(' 12345 ')).toBe(12345);
    expect(parsePort('\t3000\n')).toBe(3000);
    expect(parsePort('03000')).toBe(3000);
  });

  describe('edge cases', () => {
    it.each([undefined, null])('returns undefined for the missing value %s', value => {
      expect(parsePort(value)).toBeUndefined();
    });

    it.each(['', '   '])('returns undefined for the empty value %j', value => {
      expect(parsePort(value)).toBeUndefined();
    });

    it.each(['0', '65536', '99999999999999999999'])(
      'returns undefined for the out-of-range port %j',
      value => {
        expect(parsePort(value)).toBeUndefined();
      },
    );

    it.each([
      'abc',
      '3000abc',
      '30 00',
      '-1',
      '+3000',
      '3000.5',
      '3e3',
      '0x1F90',
      'NaN',
      'Infinity',
    ])('returns undefined for the invalid port %j', value => {
      expect(parsePort(value)).toBeUndefined();
    });

    it.each([3000, NaN, true, {}, ['3000']])(
      'returns undefined for the value %j, which is not a string',
      value => {
        expect(parsePort(value)).toBeUndefined();
      },
    );
  });
});

describe('getServerPorts', () => {
  it('uses PORT for both the dev and the preview server', () => {
    expect(getServerPorts({ PORT: '12345' })).toEqual({ dev: 12345, preview: 12345 });
  });

  it('ignores the other variables', () => {
    expect(getServerPorts({ PORT: '12345', BROWSER: 'none', VITE_PORT: '4000' })).toEqual({
      dev: 12345,
      preview: 12345,
    });
  });

  describe('without a valid PORT, as in the main checkout', () => {
    const defaultPorts = { dev: DEFAULT_DEV_PORT, preview: DEFAULT_PREVIEW_PORT };

    it('keeps the default ports without PORT', () => {
      expect(getServerPorts({})).toEqual(defaultPorts);
      expect(getServerPorts({ PORT: undefined })).toEqual(defaultPorts);
    });

    it('keeps the default ports without an environment', () => {
      expect(getServerPorts()).toEqual(defaultPorts);
      expect(getServerPorts(null as never)).toEqual(defaultPorts);
    });

    it.each(['', '  ', 'abc', '0', '65536', '3000.5'])(
      'keeps the default ports for the invalid PORT %j',
      PORT => {
        expect(getServerPorts({ PORT })).toEqual(defaultPorts);
      },
    );
  });
});
